from django.shortcuts import render
from django.shortcuts import redirect

def setDefaultContext(request):
    return { 'account_id' : request.session.get('account_id') }

def index(request):
    return render(request, 'jsTest/index.html', setDefaultContext(request))

def useAccount(request):
    request.session['account_id'] = request.POST['account_id'] 
    return redirect('index.html')
