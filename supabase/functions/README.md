# Razorpay payment functions

Three edge functions. They exist because taking a payment needs the Razorpay
key secret, and anything shipped to the browser can be read by the person
paying — a secret in the bundle is not a secret.

| Function | Called by | Auth |
|---|---|---|
| `razorpay-create-order` | the app, when a candidate opens checkout | the candidate's JWT |
| `razorpay-verify` | the app, from Razorpay's in-page callback | the candidate's JWT |
| `razorpay-webhook` | Razorpay's servers | **signature only — JWT verification must be off** |

`razorpay-verify` is the fast path; `razorpay-webhook` is the source of truth.
A candidate who pays and then closes the tab never triggers the callback, so
without the webhook they would be charged and get nothing.

## Environment variables

Set these on the Supabase service (Coolify → the Supabase service →
Environment Variables), then restart it:

| Variable | Where it comes from |
|---|---|
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → Account & Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | shown **once** when the key is generated |
| `RAZORPAY_WEBHOOK_SECRET` | you choose it when creating the webhook |
| `CERTIFICATE_PRICE_PAISE` | optional, defaults to `29900` (₹299) |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are already
provided by the stack.

Use **test mode** keys (`rzp_test_…`) until the whole flow has been exercised
end to end. Razorpay publishes test card numbers for that.

## Deploying on this self-hosted stack

The edge runtime serves whatever is in its functions volume, normally
`volumes/functions` beside the Supabase compose file. Copy these three
directories plus `_shared` there, keeping the layout, and restart the
`supabase-edge-functions` container.

From the repo checkout on the server:

```bash
cd /opt/hermy-hq/aarogya-certify && git pull
SUPA=/data/coolify/services/rhcj2lg9jrd79p8ubnl888dl   # adjust if different
cp -r supabase/functions/_shared \
      supabase/functions/razorpay-create-order \
      supabase/functions/razorpay-verify \
      supabase/functions/razorpay-webhook \
      "$SUPA/volumes/functions/"
docker restart $(docker ps --format '{{.Names}}' | grep -i edge)
```

Check they are reachable (401 is the correct answer to an unauthenticated
call — it means the function is running):

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  https://db.aarogyaindia.cloud/functions/v1/razorpay-create-order
```

`404` means the files are not in the volume; `503` means the runtime is down.

## Webhook

In the Razorpay Dashboard → Settings → Webhooks, add:

- URL: `https://db.aarogyaindia.cloud/functions/v1/razorpay-webhook`
- Secret: the same value as `RAZORPAY_WEBHOOK_SECRET`
- Event: `payment.captured`

**This function must not require a JWT.** Razorpay sends no user token; the
signature over the raw body is what authenticates it. If the stack enforces JWT
verification globally, that has to be disabled for this one function, or every
webhook returns 401 and payments silently never complete.

## Database

Apply `supabase/migrations/0006_payment_enforcement.sql` before going live. It
marks existing certificates as paid — without it, everyone who already earned
one loses their download the moment gating turns on — and revokes the RPCs that
let a client set its own price.
