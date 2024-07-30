$(document).ready(function() {
    var $carrosselInner = $('.carrossel-inner');
    var $items = $('.carrossel-item');
    var totalItems = $items.length;
    var itemWidth = 100;
    var currentIndex = 0;
    var interval;

    function moveToIndex(index) {
        var newTransform = -index * itemWidth + '%';
        $carrosselInner.css('transform', 'translateX(' + newTransform + ')');
    }

    function startAutoSlide() {
        interval = setInterval(function() {
            currentIndex = (currentIndex + 1) % totalItems;
            moveToIndex(currentIndex);
        }, 1200); 
    }

    function stopAutoSlide() {
        clearInterval(interval);
    }

    $('.carrossel').hover(
        function() {
            
            stopAutoSlide(); 
            startAutoSlide(); 
        },
        function() {
            
            stopAutoSlide();
        }
    );

    
    moveToIndex(currentIndex);
});
