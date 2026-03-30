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
    const foodCategorySelect = document.getElementById('food-category');
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

    // --- Kakao Map Logic ---
    var container = document.getElementById('map');
    var options = {
        center: new kakao.maps.LatLng(33.450701, 126.570667),
        level: 3
    };

    var map = new kakao.maps.Map(container, options);
    var ps = new kakao.maps.services.Places(); 

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
        const foodType = foodCategorySelect.value;
        const time = mealTimeSelect.value;
        const center = map.getCenter();
        
        let keyword = `${foodType} ${time}`.trim();
        
        const searchOptions = {
            location: center,
            radius: 2000,
            sort: kakao.maps.services.SortBy.DISTANCE
        };

        // 특정 카테고리 로직 (카페의 경우 CE7 그룹 코드를 사용하면 더 정확함)
        if (foodType === '카페') {
            ps.categorySearch('CE7', (data, status) => {
                handleSearchResults(data, status, '카페');
            }, searchOptions);
        } else {
            // 일반 음식점 키워드 검색
            ps.keywordSearch(keyword, (data, status) => {
                handleSearchResults(data, status, keyword);
            }, searchOptions);
        }
    });

    function handleSearchResults(data, status, keyword) {
        console.log(`검색 완료 - 키워드: ${keyword}, 결과수: ${data ? data.length : 0}`);
        
        if (status === kakao.maps.services.Status.OK) {
            const randomIndex = Math.floor(Math.random() * data.length);
            displayResult(data[randomIndex]);
        } else {
            alert(`주변에 "${keyword}" 조건에 맞는 장소를 찾지 못했습니다.`);
        }
    }

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
