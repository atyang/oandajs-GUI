// Constants per account
var pairsList = [];
var activeAccountId;
var accSummaryFields;
var $txList;
var $tradeTemplate;
var $orderTemplate;
var openTradeFields;
var openOrderFields;
var refreshTime = 500;

// Misc
function resizeSidesContent($lSide, $rSide, $lObj) {
    var lWidth = $lSide.width();
    var rWidth = $rSide.width();
    
    if($('#rightSide #txListContainer').length != 0) {
        $('#rightSide .btn-group .btn').width((rWidth-3)/2);
    }
    
    $lObj.find('.btn.txType').width((lWidth-2)/2);
}

// Account functions
function getDisplayedAccountFields($table) {
    var fieldsList = {};
    
    $.each($table.find("*[id]"), function(i, obj) {
        fieldsList[obj.id] = obj;
    }); 
    
    return fieldsList;
}

function updateAccountInfo() {
    return setInterval(function() {
        if(activeAccountId != '') {
            getAccountInfo();
        }
    }, refreshTime);
}

// Trading form functions
function printPairForTrade($selector, pair) {
    $selector.append('<option value="'+pair.instrument+'">'+pair.displayName+'</option>');
}

function toggleOrderParams(txType) {
    if (txType == 'order') {
        $('.orderParam').fadeIn();
    }
    else {        
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
    }
    else {
        sideBtn.className += ' active btn-danger';
    }
}

function alertResponse(response, type) {
    if(response.error) {
        alert(response.error.message);
    }
    else {
        if(type == 'trade') {
            getTradeList();
        }
        else {
            getOrderList();
        }
        
        alert('A trade or order has been created!');    
    }
}

function tradeAction(form) {
    var data = {}, opt = {};
    var allowedOptParams = [ 'takeProfit', 'stopLoss', 'trailingStop', 'lowerBound', 'upperBound' ]
    
    $.each($(form).serializeArray(), function(i, obj) {
        if(allowedOptParams.indexOf(obj.name) != -1) {
            if(obj.value != '') {
                opt[obj.name] = obj.value;
            }
        }
        else {
            data[obj.name] = obj.value;
        }
    });    
    data['opt'] = opt;

    if(data['transaction_type'] == 'trade') {
        createTrade(data);
    }
    else if(data['transaction_type'] == 'order') {
        createOrder(data);
    }
}

// Transaction List functions
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

function setListType(listTypeBtn) {
    var type = listTypeBtn.innerHTML.toLowerCase();
    
    $('input[name=listType]').val(type);    
    $(listTypeBtn).parent().find('.active').attr('class','btn');
    listTypeBtn.className += ' active';
    
    getList(type);
}

function getList(type) {
    if (type == 'trades') {
        getTradeList();
    }
    else {
        getOrderList();
    }
}

function printForList(fields, obj, $newTx) {
    $.each(fields, function(i, param) {
        if(obj[param] == 'buy') {
            $newTx.find('.side').html('Long');
        } else if (obj[param] == 'sell') {
            $newTx.find('.side').html('Short');
        } else {
            $newTx.find('.'+param).html(obj[param]);
        }
    });
    
    $newTx.attr('id',obj['id']);
}

function printOpenTrade(trade) {
    var $newTrade = $tradeTemplate.clone().removeAttr('id');
    printForList(openTradeFields, trade, $newTrade);
    
    $newTrade.appendTo($txList);
}

function printOpenOrder(order) {
    var $newOrder = $orderTemplate.clone().removeAttr('id');
    printForList(openTradeFields, order, $newOrder);

    $newOrder.appendTo($txList);
}

function changeSideColor() {
    $('#txList span.side').each(function() {
        if (this.innerHTML == 'Long') {
            this.style.color = 'green';
        } else {
            this.style.color = 'red';
        }
    });
}

// Trade API functions
function createAccount(form) {
    var currency = $(form).serializeArray()[0].value || 'USD';
    OANDA.account.register(currency, function(response) {
        $('#accountId').val(response.accountId);
        $('#useAccount').submit();
    });
}

function getAccountInfo() {
    OANDA.account.listSpecific(activeAccountId, function(response) {
        $.each(accSummaryFields, function(i, obj) {
            $(obj).html(response[i]);
        });
    });
}

function getPairsList() {    
    OANDA.rate.instruments(['displayName'], function(response) {
        var $selector = $('#pairSelector');        

        $.each(response.instruments, function(i, obj) {
            pairsList[i] = obj;
            printPairForTrade($selector, obj);
        });
    });
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

// After document loads
$(function() {
    getPairsList(pairsList);
    activeAccountId = $('#accountId').val();    
    accSummaryFields = getDisplayedAccountFields($('#accountSummary'));
    $txList = $('#txList');
    $tradeTemplate = $('#tradeTemplate');
    $orderTemplate = $('#orderTemplate');    
    openTradeFields = getOpenTradeFields($tradeTemplate);
    openOrderFields = getOpenOrderFields($orderTemplate);
    
    //make sure elements in leftSide and rightSide have the proper width
    var $left = $('#leftSide');
    var $right = $('#rightSide');
    var $txType = $('#tradeForm');
    resizeSidesContent($left, $right, $txType);
    $(window).resize(function() {
        resizeSidesContent($left, $right, $txType);
    });  
    
    getAccountInfo();
    //var run = updateAccountInfo();
    
    //update tradeList
    getTradeList();
    $('#listType div').click(function() {
        setListType(this);
    });
    
    //trading form style and setting certain inputs
    $('.orderParam').hide();    
    $('#transactionSide div').click(function() {
        setTxSide(this);
    });    
    $('#transactionType div').click(function() {
        setTxType(this);
    });
});
