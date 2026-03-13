// Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. 데이터 로드 및 전역 변수 설정
    const reservations = JSON.parse(localStorage.getItem('dragonHillsReservations')) || [];
    let mealsChartInstance = null;
    
    // 오늘 날짜 문자열 YYYY-MM-DD
    const today = new Date();
    const todayStr = getLocalDateString(today);

    // 2. 초기 렌더링 실행
    updateKPIs();
    renderTable();
    initChart();
    
    // 오늘 날짜로 일자별 명단 초기 조회 세팅
    document.getElementById('searchDate').value = todayStr;
    searchDailyList(todayStr);

    // 3. 이벤트 리스너 등록
    document.getElementById('btnSearchDate').addEventListener('click', () => {
        const dateInput = document.getElementById('searchDate').value;
        if(dateInput) searchDailyList(dateInput);
    });

    document.getElementById('btnClearData').addEventListener('click', () => {
        if(confirm('모든 데이터가 삭제됩니다. 정말 초기화하시겠습니까?')) {
            localStorage.removeItem('dragonHillsReservations');
            location.reload();
        }
    });

    // --- 유틸 및 렌더링 함수들 ---

    // 로컬 타임존 반영한 YYYY-MM-DD 포맷 변환
    function getLocalDateString(date) {
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date - offset)).toISOString().slice(0, 10);
        return localISOTime;
    }

    // 일자 차이 계산 
    function getDaysDiff(start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    }

    // 상단 KPI 카드 업데이트
    function updateKPIs() {
        let todayArrivalCount = 0;
        let todayDepartureCount = 0;
        let todayMealCount = 0;

        reservations.forEach(res => {
            // 체크인 인원 합산
            if (res.checkinDate === todayStr) {
                todayArrivalCount += res.guestCount;
            }
            // 체크아웃 인원 합산
            if (res.checkoutDate === todayStr) {
                todayDepartureCount += res.guestCount;
            }
            // 오늘 식수 중인 인원 (체크인 <= 오늘 < 체크아웃)
            if (res.checkinDate <= todayStr && todayStr < res.checkoutDate) {
                todayMealCount += res.guestCount;
            }
        });

        document.getElementById('totalReservations').innerText = reservations.length;
        document.getElementById('todayArrivals').innerText = todayArrivalCount + '명';
        document.getElementById('todayDepartures').innerText = todayDepartureCount + '명';
        document.getElementById('todayMeals').innerText = todayMealCount + '명';
    }

    // 메인 테이블 데이터 렌더링
    function renderTable() {
        const tbody = document.querySelector('#reservationsTable tbody');
        
        if (reservations.length === 0) return; // 비어있으면 html 기본 메시지 유지
        
        tbody.innerHTML = '';
        // 최신순 렌더링
        const sorted = [...reservations].sort((a,b) => b.id - a.id);
        
        sorted.forEach(res => {
            const tr = document.createElement('tr');
            
            // 등록일시 포맷팅
            const created = new Date(res.createdAt);
            const createdFormat = `${created.getFullYear().toString().substr(-2)}.${(created.getMonth()+1).toString().padStart(2,'0')}.${created.getDate().toString().padStart(2,'0')} ${created.getHours().toString().padStart(2,'0')}:${created.getMinutes().toString().padStart(2,'0')}`;
            
            const nights = getDaysDiff(res.checkinDate, res.checkoutDate);
            const status = (res.checkinDate > todayStr) ? '<span class="badge" style="background:#f59e0b">예약대기</span>' : 
                           (res.checkinDate <= todayStr && res.checkoutDate > todayStr) ? '<span class="badge" style="background:#10b981">투숙중</span>' : 
                           '<span class="badge" style="background:#64748b">완료</span>';

            tr.innerHTML = `
                <td>${createdFormat}</td>
                <td><strong>${res.guestName}</strong></td>
                <td>${res.guestPhone}</td>
                <td>${res.checkinDate}</td>
                <td>${res.checkoutDate}</td>
                <td>${res.guestCount}명 (${nights}박)</td>
                <td>${status}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 명단 조회 
    function searchDailyList(targetDate) {
        const arrivalList = document.getElementById('arrivalList');
        const departureList = document.getElementById('departureList');
        
        arrivalList.innerHTML = '';
        departureList.innerHTML = '';

        let arrCount = 0;
        let depCount = 0;

        reservations.forEach(res => {
            if (res.checkinDate === targetDate) {
                arrivalList.innerHTML += `<li><strong>${res.guestName}</strong> 님 (외 ${res.guestCount - 1}명) - ${res.guestPhone}</li>`;
                arrCount++;
            }
            if (res.checkoutDate === targetDate) {
                departureList.innerHTML += `<li><strong>${res.guestName}</strong> 님 (외 ${res.guestCount - 1}명) - ${res.guestPhone}</li>`;
                depCount++;
            }
        });

        if (arrCount === 0) arrivalList.innerHTML = '<li class="empty-state">해당 일자의 입국(체크인) 예정자가 없습니다.</li>';
        if (depCount === 0) departureList.innerHTML = '<li class="empty-state">해당 일자의 출국(체크아웃) 예정자가 없습니다.</li>';
    }

    // 식수 인원 차트 (Chart.js)
    function initChart() {
        const ctx = document.getElementById('mealsChart').getContext('2d');
        
        // 오늘부터 14일간의 날짜 라벨 생성
        const labels = [];
        const mealDataArray = [];
        
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const dateStr = getLocalDateString(d);
            labels.push(dateStr.slice(5)); // MM-DD 포맷
            
            // 해당 일자의 전체 식수 인원 계산
            let dailyMeals = 0;
            reservations.forEach(res => {
                if (res.checkinDate <= dateStr && dateStr < res.checkoutDate) {
                    dailyMeals += res.guestCount;
                }
            });
            mealDataArray.push(dailyMeals);
        }

        mealsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '일자별 식수(투숙) 인원',
                    data: mealDataArray,
                    backgroundColor: 'rgba(197, 160, 89, 0.6)',
                    borderColor: 'rgba(197, 160, 89, 1)',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
});
