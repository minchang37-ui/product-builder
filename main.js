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

            // 지도 탭 선택 시 레이아웃 재계산 (카카오맵 깨짐 방지)
            if (target === 'restaurant' && map) {
                setTimeout(() => {
                    map.relayout();
                    if (currentCenter) map.setCenter(currentCenter);
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
                if (i === count - 1) {
                    lottoResultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
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

    // --- Kakao Map Logic ---
    let map;
    let ps;
    let currentCenter;

    function initMap() {
        const container = document.getElementById('map');
        const options = {
            center: new kakao.maps.LatLng(37.5665, 126.9780),
            level: 3
        };

        map = new kakao.maps.Map(container, options);
        ps = new kakao.maps.services.Places();
        currentCenter = map.getCenter();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const locPosition = new kakao.maps.LatLng(lat, lon);
                map.setCenter(locPosition);
                currentCenter = locPosition;
            });
        }

        kakao.maps.event.addListener(map, 'center_changed', () => {
            currentCenter = map.getCenter();
        });
    }

    if (typeof kakao !== 'undefined' && kakao.maps) {
        initMap();
    }

    // --- Restaurant Recommendation Logic ---
    recommendBtn.addEventListener('click', () => {
        if (!ps) {
            alert('지도가 아직 로드되지 않았습니다.');
            return;
        }

        const price = priceRangeSelect.value;
        const time = mealTimeSelect.value;
        const keyword = `${price} ${time}`.trim() || '맛집';
        const center = map.getCenter();
        
        const searchOptions = {
            location: center,
            radius: 1000,
            sort: kakao.maps.services.SortBy.DISTANCE
        };

        ps.keywordSearch(keyword, (data, status) => {
            if (status === kakao.maps.services.Status.OK) {
                const randomIndex = Math.floor(Math.random() * data.length);
                const place = data[randomIndex];
                displayResult(place);
            } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
                alert('주변에 조건에 맞는 맛집이 없습니다.');
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

        const moveLatLon = new kakao.maps.LatLng(place.y, place.x);
        map.panTo(moveLatLon);

        new kakao.maps.Marker({
            map: map,
            position: moveLatLon
        });
    }
});
