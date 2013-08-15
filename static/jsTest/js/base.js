// Constants per account
var EPSILON = 0.000001;
var pairsList = [];
var activeAccountId;
var accSummaryFields;
var pairsSelectedList = [ 'EUR_USD', 'USD_CAD', 'AUD_USD', 'GBP_USD', 'EUR_JPY', 'USD_JPY' ]
var $pairsSelected;
var $pairsNotSelected;
var $ratesList;
var $rateTemplate;
var $txList;
var $tradeTemplate;
var $orderTemplate;
var openTradeFields;
var openOrderFields;
var refreshTime = 500;
var GREEN = 'rgb(0,220,0)';
var RED = 'rgb(255,0,0)';

// Misc
jQuery.fn.highlight = function(color) {
    this.animate({color:color}, 200).delay(400).animate({color:'#000'}, 200);
}

function priceIncrease(oldPrice, newPrice) {
    return ((newPrice - oldPrice) > EPSILON)
}

function resizeSidesContent($lSide, $rSide, $lObj) {
    var lWidth = $lSide.width();
    var rWidth = $rSide.width();
    
    if ($('#trades #txListContainer').length != 0) {
        $('#trades .btn-group .btn').width((rWidth-3)/2);
    }
    
    $lObj.find('.btn.txType').width((lWidth-2)/2);
}

// Account functions
function startAccount() {
    getAccountInfo();
    updateAccountInfo();
}

function getDisplayedAccountFields($table) {
    var fieldsList = {};
    
    $.each($table.find("*[id]"), function(i, obj) {
        fieldsList[obj.id] = obj;
    }); 
    
    return fieldsList;
}

function updateAccountInfo() {
    return setInterval(function() {
        if (activeAccountId != '') {
            getAccountInfo();
        }
    }, refreshTime);
}

function changePLColor(pl) {
    if (pl.innerHTML.indexOf('-') == -1) {
        pl.style.color = GREEN;
    } else {
        pl.style.color = RED;
    }
}

// Trading form functions
function setOpenTxSideAndType() {
    $('.orderParam').hide();
    $('#transactionSide div').bind('click',function() {
        setTxSide(this);
    });
    $('#transactionType div').bind('click',function() {
        setTxType(this);
    });
}

function printPairForTrade($selector, pair) {
    $selector.append('<option value="'+pair.instrument+'">'+pair.displayName+'</option>');
}

function toggleOrderParams(txType) {
    if (txType == 'order') {
        $('.orderParam').fadeIn();
    } else {        
        $('.orderParam').fadeOut();
    }        
}

function setTxType(typeBtn) {
    var type = typeBtn.innerHTML.toLowerCase();
    
    $('input[name=transaction_type]').val(type);    
    $(typeBtn).parent().find('.active').attr('class','btn');
    typeBtn.className += ' active btn-info';
    
    toggleOrderParams(type);
}

function setTxSide(sideBtn) {
    var side = sideBtn.innerHTML.toLowerCase();

    $('input[name=side]').val(side);
    $(sideBtn).parent().find('.active').attr('class','btn');
    if (side == 'buy') {
        sideBtn.className += ' active btn-success';
    } else {
        sideBtn.className += ' active btn-danger';
    }
}

function alertResponse(response, type) {
    if (response['error']) {
        alert(response['error'].message);
    } else {
        if (type == 'trade') {
            getTradeList();
        } else {
            getOrderList();
        }
        
        alert('A trade or order has been created!');    
    }
}

function tradeAction(form) {
    var data = {}, opt = {};
    var allowedOptParams = [ 'takeProfit', 'stopLoss', 'trailingStop', 'lowerBound', 'upperBound' ]
    
    $.each($(form).serializeArray(), function(i, obj) {
        if (allowedOptParams.indexOf(obj.name) != -1) {
            if (obj.value != '') {
                opt[obj.name] = obj.value;
            }
        } else {
            data[obj.name] = obj.value;
        }
    });    
    data['opt'] = opt;

    if (data['transaction_type'] == 'trade') {
        createTrade(data);
    } else if (data['transaction_type'] == 'order') {
        createOrder(data);
    }
}

// Rates List functions
function startRates() {
    getRates();
    runRates = updateRates();
    toggleRatesSelector();
}

function printPairToSelect(obj) {
    $pairsNotSelected.append('<option value="'+obj.instrument+'">'+obj.displayName+'</options>');
}

function toggleRatesSelector() {
    $('#rates .toggle').bind('click',function() {
        $('#ratesSelector').slideToggle();
    });
}

function updateSelectedPairsForm(list, $dest) {
    $.each(list, function() {
        $(this).prop('selected',false).appendTo($dest);
    });
}

function addPair() {
    updateSelectedPairsForm($pairsNotSelected.find('option:selected'), $pairsSelected);
}

function removePair() {
    updateSelectedPairsForm($pairsSelected.find('option:selected'), $pairsNotSelected);
}

function addAllPairs() {
    updateSelectedPairsForm($pairsNotSelected.find('*'), $pairsSelected);
}

function removeAllPairs() {
    updateSelectedPairsForm($pairsSelected.find('*'), $pairsNotSelected);
}

function updateSelectedPairsList() {
    pairsSelectedList = [];
    $('#ratesSelector').slideUp();
    
    $pairsSelected.find('option').each(function(i, obj) {
        pairsSelectedList.push(obj.getAttribute('value'));
    });
    
    $ratesList.find('.pair-rate').each(function() {
        if (pairsSelectedList.indexOf(this.id) == -1) {
            this.remove();
        }
    });
}

function formatPrice(price) {
    var dotAtSup = (price.length - price.indexOf('.')) > 2 ? false : true;
    
    var supIndex = dotAtSup ? -2 : -1;
    var boldIndex = dotAtSup ? -4: -3;
    
    return { 'sup': sup = price.slice(supIndex, price.length), 'bold' : price.slice(boldIndex, supIndex), 'small' : price.slice(0, boldIndex) };
}

function printPrice(price, $priceDiv) {
    $priceDiv.find('.old-price').html(price);
    
    $.each(formatPrice(price), function(i, value) {
        $priceDiv.find(i).html(value);
    });
}

function updatePrice(price, $priceDiv) {
    var oldPrice = $priceDiv.find('.old-price').html();
    
    if (oldPrice != price) {
        printPrice(price, $priceDiv);
        if(priceIncrease(parseFloat(oldPrice),parseFloat(price))) {
            $priceDiv.highlight('rgb(0,220,0)');
        } else {
            $priceDiv.highlight(RED);
        }
    }
}

function printRate(data, instrument) {
    var $newRate = $rateTemplate.clone().removeAttr('id');
    
    printPrice(data['ask'].toString(), $newRate.find('.ask'));
    printPrice(data['bid'].toString(), $newRate.find('.bid'));
    
    $newRate.find('.instrument').html(instrument.replace('_','/'));
    $newRate.attr('id',instrument).appendTo($ratesList);
}

function updateRate($obj, data) {
    updatePrice(data['ask'].toString(), $obj.find('.ask'));
    updatePrice(data['bid'].toString(), $obj.find('.bid'));
}

function printOrUpdateRate(pair) {
    var instr = pair['instrument'];
    var $instrDiv = $('#'+instr);
    
    if($instrDiv.length < 1) {
        printRate(pair, instr);
    } else {
        updateRate($instrDiv, pair);
    }
}

function updateRates() {
    return setInterval (function() {
        getRates();
    }, refreshTime);
}

// Transaction List functions
function startList() {
    getTradeList();
    setListType();
}

function getOpenTradeFields($trade) {
    var fieldsList = [];
    
    $.each($trade.find("span[class]"), function(i, obj) {
        fieldsList.push(obj.className);
    });
    
    return fieldsList;
}

function getOpenOrderFields($order) {
    var fieldsList = [];
    
    $.each($order.find("span[class]"), function(i, obj) {
        fieldsList.push(obj.className);
    });
    
    return fieldsList;
}

function setListType() {
    $('#listType div').bind('click',function() {
        var type = this.innerHTML.toLowerCase();
    
        $('input[name=listType]').val(type);    
        $(this).parent().find('.active').attr('class','btn');
        this.className += ' active';
        
        getList(type);
    });
}

function getList(type) {
    if (type == 'trades') {
        getTradeList();
    } else {
        getOrderList();
    }
}

function buildNewTx(fields, obj, $newTx) {
    $.each(fields, function(i, param) {
        var value = obj[param];
        
        if (param == 'instrument') {
            value = obj[param].replace('_','/');
        }

        if (value == 'buy') {
            $newTx.find('.side').html('Long');
        } else if (value == 'sell') {
            $newTx.find('.side').html('Short');
        } else {
            $newTx.find('.'+param).html(value);
        }
    });
    
    $newTx.attr('id',obj['id']);
}

function printOpenTrade(trade) {
    var $newTrade = $tradeTemplate.clone().removeAttr('id');
    buildNewTx(openTradeFields, trade, $newTrade);
    
    $newTrade.appendTo($txList);
}

function printOpenOrder(order) {
    var $newOrder = $orderTemplate.clone().removeAttr('id');
    buildNewTx(openTradeFields, order, $newOrder);

    $newOrder.appendTo($txList);
}

function changeSideColor() {
    $('#txList span.side').each(function() {
        if (this.innerHTML == 'Long') {
            this.style.color = GREEN;
        } else {
            this.style.color = RED;
        }
    });
}

// Trade API functions
function createAccount(form) {
    var currency = $(form).serializeArray()[0].value || 'USD';
    OANDA.account.register(currency, function(response) {
        $('#accountId').val(response['accountId']);
        $('#useAccount').submit();
    });
}

function getAccountInfo() {
    OANDA.account.listSpecific(activeAccountId, function(response) {
        $.each(accSummaryFields, function(i, obj) {
            $(obj).html(response[i]);
            if (i == 'unrealizedPl' || i == 'realizedPl') {
                changePLColor(obj);
            }
        });
    });
}

function getPairsList() {    
    OANDA.rate.instruments(['displayName'], function(response) {
        var $tradeSelector = $('#pairSelector'); 

        $.each(response['instruments'], function(i, obj) {
            printPairForTrade($tradeSelector, obj);
            printPairToSelect(obj);
        });
    });
}

function getRates() {
    if (pairsSelectedList.length != 0) {
        OANDA.rate.quote(pairsSelectedList, function(response) {
            $.each(response['prices'], function(i, obj) {
                printOrUpdateRate(obj);
            });
        });
    }
}

function getTradeList() {
    OANDA.trade.list(activeAccountId, [], function(response) {
        $txList.html('');

        $.each(response['trades'], function(i, obj) {
            printOpenTrade(obj);
            changeSideColor();
        });
    });
}

function getOrderList() {
    OANDA.order.list(activeAccountId, [], function(response) {
        $txList.html('');
        
        $.each(response['orders'], function(i, obj) {
            printOpenOrder(obj);
            changeSideColor();
        });
    });
}

function createTrade(d) {    
    OANDA.trade.open(activeAccountId, d['instrument'], d['units'], d['side'], d['opt'], function(response) {
        //create a proper alert with return info, or some other way of notifying the client of trade creation
        alertResponse(response, 'trade');
    });
}

function createOrder(d) {
    var expiry = new Date();
    expiry.setTime(expiry.getTime() + (d['expiry'] * 3600 * 100));
    expiry = expiry.toISOString();
    
    OANDA.order.open(activeAccountId, d['instrument'], d['units'], d['side'], d['price'], expiry, d['type'], d['opt'], function(response) {
        //create a proper alert with return info, or some other way of notifying the client of order creation
        alertResponse(response, 'order');
    });
}

function windowResize() {    
    var $left = $('#leftSide');
    var $trades = $('#trades');
    var $txType = $('#tradeForm');
    resizeSidesContent($left, $trades, $txType);
    $(window).bind('resize',function() {
        resizeSidesContent($left, $trades, $txType);
    });
}

// After document loads
$(function() {
    getPairsList(pairsList);
    activeAccountId = $('#accountId').val();    
    accSummaryFields = getDisplayedAccountFields($('#accountSummary'));
    $pairsSelected = $('#pairsSelected');
    $pairsNotSelected = $('#pairsNotSelected');
    $ratesList = $('#ratesList');
    $txList = $('#txList');
    $rateTemplate = $('#rateTemplate');
    $tradeTemplate = $('#tradeTemplate');
    $orderTemplate = $('#orderTemplate');    
    openTradeFields = getOpenTradeFields($tradeTemplate);
    openOrderFields = getOpenOrderFields($orderTemplate);
    
    windowResize();    
    startAccount();
    setOpenTxSideAndType();
    startRates();
    startList();
});
