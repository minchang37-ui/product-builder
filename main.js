document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const recommendBtn = document.getElementById('recommend-btn');
    const priceRangeSelect = document.getElementById('price-range');
    const mealTimeSelect = document.getElementById('meal-time');
    const resultContainer = document.getElementById('result-container');
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

    // --- Kakao Map Logic ---
    let map;
    let ps; // Places service

    function initMap() {
        const container = document.getElementById('map');
        const options = {
            center: new kakao.maps.LatLng(37.5665, 126.9780), // 기본: 서울시청
            level: 3
        };

        map = new kakao.maps.Map(container, options);
        ps = new kakao.maps.services.Places();

        // 사용자 현재 위치 가져오기
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const locPosition = new kakao.maps.LatLng(lat, lon);
                map.setCenter(locPosition);
            });
        }
    }

    // 카카오맵 SDK가 로드되었는지 확인 후 초기화
    if (typeof kakao !== 'undefined' && kakao.maps) {
        initMap();
    } else {
        console.error('Kakao Maps API를 로드할 수 없습니다. appkey를 확인해주세요.');
    }

    // --- Recommendation Logic ---
    recommendBtn.addEventListener('click', () => {
        if (!ps) {
            alert('지도가 아직 로드되지 않았습니다.');
            return;
        }

        const price = priceRangeSelect.value;
        const time = mealTimeSelect.value;
        
        // 검색 키워드 생성 (예: "가성비 점심맛집", "고급 저녁맛집" 등)
        const keyword = `${price} ${time}`.trim() || '맛집';
        
        // 현재 지도 중심좌표 기준 검색
        const center = map.getCenter();
        
        const searchOptions = {
            location: center,
            radius: 1000, // 1km 반경
            sort: kakao.maps.services.SortBy.DISTANCE
        };

        ps.keywordSearch(keyword, (data, status) => {
            if (status === kakao.maps.services.Status.OK) {
                // 검색 결과 중 랜덤으로 하나 선택
                const randomIndex = Math.floor(Math.random() * data.length);
                const place = data[randomIndex];
                
                displayResult(place);
            } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
                alert('주변에 조건에 맞는 맛집이 없습니다. 위치를 옮기거나 조건을 변경해보세요.');
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
        
        resultContainer.classList.remove('hidden');
        
        // 결과창으로 스크롤 이동
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // 지도 중심을 추천된 장소로 부드럽게 이동
        const moveLatLon = new kakao.maps.LatLng(place.y, place.x);
        map.panTo(moveLatLon);

        // 마커 표시 (선택사항)
        const marker = new kakao.maps.Marker({
            map: map,
            position: moveLatLon
        });
    }
});
