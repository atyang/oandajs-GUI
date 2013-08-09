function createAccount(form) {
    var currency = $(form).serializeArray()[0].value || 'USD';
    OANDA.account.register(currency, function(response) {
        $('#accountId').val(response.accountId);
        $('#useAccount').submit();
    });
}

function getAccountInfo(accountId) {
    OANDA.account.listSpecific(accountId, function(response) {
        $('#accountSummary').html('<thead><tr>'
                                   +'<th>'+response['accountName']+'</th>'
                                   +'<th>'+response['accountCurrency']+'</th>'
                                   +'</tr></thead>'
                                   +'<tbody>'
                                   +'<tr><td>Balance:</td><td>'+response['balance']+'</td></tr>'
                                   +'<tr><td>Unrealized P&L:</td><td>'+response['unrealizedPl']+'</td></tr>'
                                   +'<tr><td>Realized P&L:</td><td>'+response['realizedPl']+'</td></tr>'
                                   +'<tr><td>Open Trades:</td><td>'+response['openTrades']+'</td></tr>'
                                   +'<tr><td>Open Orders:</td><td>'+response['openOrders']+'</td></tr>'
                                   +'<tr><td>Margin Used:</td><td>'+response['marginUsed']+'</td></tr>'
                                   +'<tr><td>Margin Available:</td><td>'+response['marginAvail']+'</td></tr>'
                                   +'<tr><td>Margin Rate:</td><td>'+response['marginRate']+'</td></tr>'
                                   +'<tr><td>Account Number:</td><td>'+response['accountId']+'</td></tr></tbody>');
        console.log(response);
    });
}

function updateAccountInfo() {
    var accountId = $('#accountId').val();
    return setInterval(function() {
        if(accountId != '') {
            getAccountInfo(accountId);
        }
    }, 500);
}

$(function() {
    var run = updateAccountInfo();
});
