# KeyAuth - Informações da Conta

## Conta
- Username: Zenity0x59
- Subscription: Manager Subscription (expira 1969-12-31 - provavelmente lifetime)

## Aplicação
- App Name: AXOwasHere
- App Version: 1.0
- Status: ACTIVE
- Users: 5
- Owner ID: mascarado na UI (precisa da Seller API)

## API do KeyAuth para Gerar Keys
A KeyAuth usa a Seller API para gerar keys programaticamente.
URL: https://keyauth.win/api/seller/

### Gerar Keys via Seller API
GET https://keyauth.win/api/seller/?sellerkey=SELLER_KEY&type=add&format=JSON&expiry=1&mask=XXXXXX-XXXXXX-XXXXXX&amount=1&owner=OWNER_USERNAME&character=2&note=NOTA

Parâmetros:
- sellerkey: chave do vendedor (obtida em Account Settings > Seller Key)
- type: add (criar key)
- format: JSON
- expiry: dias de validade (ex: 30 = 1 mês, 0 = lifetime)
- mask: formato da key (ex: XXXXXX-XXXXXX-XXXXXX)
- amount: quantidade de keys
- owner: username do dono (Zenity0x59)
- character: tipo de caracteres (2 = alfanumérico)
- note: nota da key

### Verificar Key
GET https://keyauth.win/api/seller/?sellerkey=SELLER_KEY&type=verify&key=KEY_VALUE

## Licenses Existentes
- ts1t38-A2Vm5t-8yGEsk (Used, 1 Month, KEY PARA O RESELLER)
- DJ4tQ4-bPwmFB-HBTgLk (Used, 3 Months, RENOVAR KEY LUQUINAS)
- cVdt7c-ehPmg3-CYtVrk (Used, 10 Years, RENOVAR KEY WEEZY)
- NYCt7d-dUumLi-T1A23k (Used, 10 Years)
- tWPt4H-3ugmNG-cA1oTk (Used, 10 Years)
- AXO-XXXX (Not Used, 10 Years)
- k1VOtp-S0pYIz-eH9Y4V-LAN9FO-XGpglA-RTOPP2 (Not Used, 10 Years)

## Próximo Passo
Preciso acessar a Seller Key em: https://keyauth.cc/app/?page=seller-settings
