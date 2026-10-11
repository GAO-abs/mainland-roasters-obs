# Mainland Roasters

A demo ecommerce storefront built with React and Vite. Every push to `main` builds the site and deploys it to a Huawei Cloud OBS bucket from GitHub Actions. The pipeline logs in with GitHub OIDC, so no AK/SK is stored in the repository.

The coffees, prices and roastery are made up, and checkout does not place an order.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # writes the static site to dist/
```

## How deployment works

The workflow in `.github/workflows/deploy.yml` runs these steps:

1. Checks out the code and installs dependencies with `npm install`.
2. Builds the site with `npm run build`.
3. Logs in to Huawei Cloud with [GAO-abs/huaweicloud-oidc-login](https://github.com/GAO-abs/huaweicloud-oidc-login), which swaps the run's GitHub OIDC token for a temporary access key, secret key and security token.
4. Installs `obsutil`, Huawei Cloud's OBS command-line tool.
5. Uploads `dist/` to the bucket with `obsutil sync`.

## One-time setup

### Huawei Cloud

1. Create an OIDC identity provider for GitHub Actions and a trust agency that trusts it.
2. Restrict the agency with an `oidc:sub` condition for this repository, for example `StringMatch` on `repo:GAO-abs/mainland-roasters-obs:*`.
3. Create an OBS bucket for the site and turn on static website hosting, with `index.html` as the home page.
4. Attach an identity policy to the agency that allows uploading to that bucket only. A starting point:

```json
{
  "Version": "5.0",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["obs:bucket:listBucket"],
      "Resource": ["obs:*:*:bucket:<bucket-name>"]
    },
    {
      "Effect": "Allow",
      "Action": ["obs:object:putObject", "obs:object:getObject"],
      "Resource": ["obs:*:*:object:<bucket-name>/*"]
    }
  ]
}
```

The action names and resource format above follow the pattern in Huawei Cloud's IAM examples but have not been tested against a live account. Build the policy in the console's visual editor if the JSON is rejected.

### GitHub

Add these under **Settings**, **Secrets and variables**, **Actions**, on the **Variables** tab:

| Variable | Value | Example |
| --- | --- | --- |
| `HW_ACCOUNT_ID` | Your Huawei Cloud account ID | |
| `HW_REGION` | Region of the bucket | `af-south-1` |
| `OBS_BUCKET` | Name of the bucket | `mainland-roasters-site` |
| `HW_AGENCY` | Trust agency name. Optional, defaults to `github-actions` | `github-actions` |

None of these are secrets.

## Things to know

- `obsutil sync` uploads new and changed files. It does not remove files that are no longer in `dist/`, so old hashed assets stay in the bucket until you delete them.
- Vite is configured with a relative base path, so the site works from the bucket's website endpoint or a custom domain without changes.
- The site is a single page with no client-side routes, so it needs no rewrite rules on OBS.
- OBS may serve files from the default bucket domain as downloads instead of rendering them. If that happens, bind a custom domain to the bucket.
