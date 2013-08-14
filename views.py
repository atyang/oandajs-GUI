from django.shortcuts import render
from django.shortcuts import redirect

def setDefaultContext(request):
    focus_trades = request.session.setdefault('focus_trades', False)
    return { 'account_id' : request.session['account_id'], 'focus_trades' : focus_trades }

def index(request):
    return render(request, 'jsTest/index.html', setDefaultContext(request))

def useAccount(request):
    request.session['account_id'] = request.POST['account_id'] 
    return redirect('index.html')

def setFocus(request):
    focus = request.POST['focus_trades']

    if focus == 'trades':
        request.session['focus_trades'] = True
    else:
        request.session['focus_trades'] = False 

    return redirect('index.html')
