from django.shortcuts import render

def setAccountContext(request):
    return { 'account_id' : request.session['account_id'] }

def index(request):
    return render(request, 'jsTest/index.html', setAccountContext(request))

def useAccount(request):
    request.session['account_id'] = request.POST['account_id'] 
    context = setAccountContext(request)

    return render(request, 'jsTest/index.html', context)
