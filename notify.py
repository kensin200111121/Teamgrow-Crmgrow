#!/usr/bin/env python3
# Author: Chad Miller
# Date: 09/20/2023
# Purpose: This script is run to notify slack of the new review app
import os,subprocess,sys

# Variables
Hyrum = "<@U01CBA81JVA>"
Joe = "<@U01C36AG2UA>"
Micah = "<@U02HSPV7ZS4>"
Super = "<@UQLUZPBN0>"

# Functions
def notify_product_about_gitlab_triggered_review_app():
    cpn = os.environ.get("CI_PROJECT_NAME")
    cpu = os.environ.get("CDN_PUBLIC_URL")
    ccss = os.environ.get("CI_COMMIT_SHORT_SHA")
    sa = os.environ.get("PRODUCT_CHANNEL_SLACK_AUTH")
    message = f'{{ "text": "{Super} Import map override @redx/{cpn} https://{cpu}/{cpn}/{ccss}/redx-{cpn}.js" }}'
    cmd = f"curl -d '{message}' -X POST https://hooks.slack.com/services/{sa} -H 'Content-type: application/json'"
    subprocess.run(cmd,shell=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)

def notify_crmqa_about_deployment_to_stage_in_gitlab():
    cpn = os.environ.get("CI_PROJECT_NAME")
    cpu = os.environ.get("CDN_PUBLIC_URL")
    ccss = os.environ.get("CI_COMMIT_SHORT_SHA")
    sa = os.environ.get("CRMQA_CHANNEL_SLACK_AUTH")
    message = f'{{ "text": "{Hyrum} {Joe} {Micah} {cpn} {ccss} has been deployed to stage" }}'
    cmd = f"curl -d '{message}' -X POST https://hooks.slack.com/services/{sa} -H 'Content-type: application/json'"
    subprocess.run(cmd,shell=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)

def notify_product_about_github_triggered_manual_review_app():
    gsha = os.environ.get("GSHA")
    sa = os.environ.get("SA")
    message = f'{{ "text": "Import map override @redx/crm-client == https://storage.googleapis.com/vortex-frontend-review/crm-client/{gsha}/redx-crm-client.js" }}'
    cmd = f"curl -d '{message}' -X POST https://hooks.slack.com/services/{sa} -H 'Content-type: application/json'"
    subprocess.run(cmd,shell=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)

def main():
    if os.environ.get("GSHA"):
        notify_product_about_github_triggered_manual_review_app()
        sys.exit()
    if os.environ.get("CI_ENVIRONMENT_NAME"):
        environment = os.environ.get("CI_ENVIRONMENT_NAME")
        if environment == 'review':
            notify_product_about_gitlab_triggered_review_app()
        if environment == 'stage':
            notify_crmqa_about_deployment_to_stage_in_gitlab()

if __name__ == "__main__": main()
