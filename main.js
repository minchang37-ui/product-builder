document.addEventListener('DOMContentLoaded', () => {
    // --- Common Elements ---
    const themeToggle = document.getElementById('theme-toggle');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- Lotto Elements ---
    const generateBtn = document.getElementById('generate-btn');
    const gameCountSelect = document.getElementById('game-count');
    const lottoResultContainer = document.getElementById('lotto-result-container');

    // --- Restaurant Elements ---
    const recommendBtn = document.getElementById('recommend-btn');
    const priceRangeSelect = document.getElementById('price-range');
    const mealTimeSelect = document.getElementById('meal-time');
    const restaurantResultContainer = document.getElementById('restaurant-result-container');
    const placeName = document.getElementById('place-name');
    const placeCategory = document.getElementById('place-category');
    const placeAddress = document.getElementById('place-address');
    const placeLink = document.getElementById('place-link');
    const getLocationBtn = document.getElementById('get-location-btn');

    // --- Theme Logic ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }

    // --- Tab Logic ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${target}-section`).classList.add('active');

            // 탭 전환 시 지도 레이아웃 보정
            if (target === 'restaurant' && map) {
                setTimeout(() => {
                    map.relayout();
                    map.setCenter(new kakao.maps.LatLng(33.450701, 126.570667));
                }, 100);
            }
        });
    });

    // --- Lotto Logic ---
    generateBtn.addEventListener('click', () => {
        const count = gameCountSelect.value;
        lottoResultContainer.innerHTML = ''; 

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const gameRow = createLottoRow(i + 1);
                lottoResultContainer.appendChild(gameRow);
            }, i * 100);
        }
    });

    function createLottoRow(gameNum) {
        const row = document.createElement('div');
        row.className = 'lotto-row';

        const label = document.createElement('span');
        label.className = 'game-label';
        label.textContent = `Game ${gameNum}`;
        row.appendChild(label);

        const numbers = [];
        while (numbers.length < 7) {
            const num = Math.floor(Math.random() * 45) + 1;
            if (!numbers.includes(num)) numbers.push(num);
        }

        const mainNums = numbers.slice(0, 6).sort((a, b) => a - b);
        const bonusNum = numbers[6];

        mainNums.forEach(num => {
            row.appendChild(createBall(num));
        });

        const plus = document.createElement('span');
        plus.className = 'plus-sign';
        plus.textContent = '+';
        row.appendChild(plus);

        row.appendChild(createBall(bonusNum));

        return row;
    }

    function createBall(num) {
        const ball = document.createElement('div');
        ball.className = 'ball';
        if (num <= 10) ball.classList.add('range-1');
        else if (num <= 20) ball.classList.add('range-11');
        else if (num <= 30) ball.classList.add('range-21');
        else if (num <= 40) ball.classList.add('range-31');
        else ball.classList.add('range-41');
        ball.textContent = num;
        return ball;
    }

    // --- Kakao Map Logic (가이드 표준 코드 적용) ---
    var container = document.getElementById('map'); //지도를 담을 영역의 DOM 레퍼런스
    var options = { //지도를 생성할 때 필요한 기본 옵션
        center: new kakao.maps.LatLng(33.450701, 126.570667), //지도의 중심좌표.
        level: 3 //지도의 레벨(확대, 축소 정도)
    };

    var map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴
    
    // 맛집 검색을 위한 서비스 객체 생성
    var ps = new kakao.maps.services.Places(); 

    // 내 위치 버튼 클릭 이벤트
    getLocationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                var moveLatLon = new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude);
                map.setCenter(moveLatLon);
            }, () => {
                alert('위치 정보를 가져올 수 없습니다.');
            });
        }
    });

    // --- Restaurant Recommendation Logic ---
    recommendBtn.addEventListener('click', () => {
        const price = priceRangeSelect.value;
        const time = mealTimeSelect.value;
        const keyword = `${price} ${time}`.trim() || '맛집';
        const center = map.getCenter();
        
        console.log(`검색 시작! 키워드: "${keyword}", 좌표: ${center.toString()}`);

        const searchOptions = {
            location: center,
            radius: 2000, // 범위를 2km로 확장하여 더 많은 결과를 찾음
            sort: kakao.maps.services.SortBy.DISTANCE
        };

        ps.keywordSearch(keyword, (data, status) => {
            // 디버깅을 위해 결과 리스트를 콘솔에 출력
            console.log('검색 상태:', status);
            console.log('검색 결과 리스트:', data);

            if (status === kakao.maps.services.Status.OK) {
                console.log(`총 ${data.length}개의 맛집을 찾았습니다.`);
                const randomIndex = Math.floor(Math.random() * data.length);
                const place = data[randomIndex];
                displayResult(place);
            } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
                alert(`"${keyword}" 조건에 맞는 장소를 찾지 못했습니다. 금액대나 시간을 '전체'로 설정하고 다시 시도해보세요.`);
            } else {
                alert('검색 중 오류가 발생했습니다.');
            }
        }, searchOptions);
    });

    function displayResult(place) {
        placeName.textContent = place.place_name;
        placeCategory.textContent = place.category_name;
        placeAddress.textContent = place.road_address_name || place.address_name;
        placeLink.href = place.place_url;
        
        restaurantResultContainer.classList.remove('hidden');
        restaurantResultContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

        var moveLatLon = new kakao.maps.LatLng(place.y, place.x);
        map.panTo(moveLatLon);

        new kakao.maps.Marker({
            map: map,
            position: moveLatLon
        });
    }
});
