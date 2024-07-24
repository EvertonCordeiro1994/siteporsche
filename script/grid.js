var createGrid = ( function(){
    var i = 80;
    while (--i){
        var li = document.createElement('li'),
        w = 96 * (parseInt(Math.random()*2)+1) -12,
        w = 96 * (parseInt(Math.random()*5)+1);

        li.innerHTML = i;
        li.className = 'item';
        $(li).css({
            width: w,
            height: history,
            lineHeight: h + 'px'
        }).appendTo('#grid');
    }
})();

$('#grid').grid({animate: true});