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

            // 가이드 권장: 레이아웃 재계산 및 중심 좌표 유지
            if (target === 'restaurant') {
                if (!map) {
                    loadKakaoMap(); 
                } else {
                    setTimeout(() => {
                        map.relayout();
                        if (currentCenter) map.setCenter(currentCenter);
                    }, 100);
                }
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
    let map = null;
    let ps = null;
    let currentCenter = null;

    function initMap() {
        const container = document.getElementById('map');
        if (!container) return;

        // 가이드 Step 3: 지도 생성
        const options = {
            center: new kakao.maps.LatLng(37.5665, 126.9780),
            level: 3
        };

        map = new kakao.maps.Map(container, options);
        currentCenter = map.getCenter();

        // 가이드 #whatlibrary: 라이브러리 서비스 사용
        if (kakao.maps.services) {
            ps = new kakao.maps.services.Places();
            console.log('Places service initialized.');
        } else {
            console.error('Kakao Maps Services library is missing.');
        }

        // 초기 위치 요청
        requestMyLocation(false);

        kakao.maps.event.addListener(map, 'center_changed', () => {
            currentCenter = map.getCenter();
        });
    }

    function loadKakaoMap() {
        // 가이드 Step 2: autoload=false 일 때 kakao.maps.load 사용
        if (window.kakao && window.kakao.maps) {
            kakao.maps.load(() => {
                initMap();
                console.log('Kakao Map and Libraries loaded successfully.');
            });
        } else {
            console.warn('Waiting for Kakao Maps SDK script...');
            setTimeout(loadKakaoMap, 500);
        }
    }

    // 초기 로드 시 시도
    loadKakaoMap();

    function requestMyLocation(showAlert = true) {
        if (!map) return;
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const locPosition = new kakao.maps.LatLng(lat, lon);
                map.setCenter(locPosition);
                currentCenter = locPosition;
            }, (err) => {
                if (showAlert) {
                    alert('위치 권한을 확인해주세요.');
                }
            }, { timeout: 5000 });
        }
    }

    getLocationBtn.addEventListener('click', () => {
        requestMyLocation(true);
    });

    // --- Restaurant Recommendation Logic ---
    recommendBtn.addEventListener('click', () => {
        if (!ps) {
            alert('맛집 검색 서비스를 준비 중입니다. 잠시만 기다려주세요.');
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
