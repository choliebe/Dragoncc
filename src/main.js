// Main Interactivity
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reservationForm');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 데이터베이스 저장을 위한 객체 생성
            const reservationData = {
                id: Date.now(), // 고유 ID로 타임스탬프 활용
                checkinDate: document.getElementById('checkinDate').value,
                checkoutDate: document.getElementById('checkoutDate').value,
                guestCount: parseInt(document.getElementById('guestCount').value),
                guestName: document.getElementById('guestName').value,
                guestPhone: document.getElementById('guestPhone').value,
                createdAt: new Date().toISOString()
            };

            // localStorage에서 기존 데이터 불러오기 (없으면 빈 배열 참조)
            const existingReservations = JSON.parse(localStorage.getItem('dragonHillsReservations')) || [];
            
            // 새 데이터 추가 및 다시 저장
            existingReservations.push(reservationData);
            localStorage.setItem('dragonHillsReservations', JSON.stringify(existingReservations));

            alert(`${reservationData.guestName}님, 예약 문의가 접수되었습니다!\n담당자가 곧 연락드리겠습니다.`);
            form.reset();
        });
    }

    // Scroll Reveal Effect
    const revealElements = document.querySelectorAll('.feature-card, .split-section');
    
    const revealOnScroll = () => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            if (rect.top < windowHeight * 0.85) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    };

    // Set initial state for reveal elements
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    });

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Trigger once on load
});
