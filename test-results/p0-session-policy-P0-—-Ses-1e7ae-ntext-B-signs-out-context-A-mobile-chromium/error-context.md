# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p0-session-policy.spec.ts >> P0 — Session policy, both directions >> Staff single session enforcement: signing in on context B signs out context A
- Location: e2e\p0-session-policy.spec.ts:11:6

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link [ref=e3] [cursor=pointer]:
      - /url: /
      - img "logo" [ref=e4]
    - button [ref=e5]
  - generic [ref=e9]:
    - generic [ref=e11]:
      - img "logo" [ref=e13]
      - generic [ref=e14]:
        - link "SA System Admin SUPER ADMIN" [ref=e15] [cursor=pointer]:
          - /url: /profile
          - generic [ref=e16]: SA
          - generic [ref=e18]:
            - paragraph [ref=e20]: System Admin
            - generic [ref=e21]: SUPER ADMIN
        - button [ref=e22]
    - main [ref=e24]:
      - generic [ref=e26]:
        - generic [ref=e27]:
          - heading "System Dashboard" [level=1] [ref=e28]
          - paragraph [ref=e29]: Platform-wide overview and administration
        - generic [ref=e30]:
          - generic [ref=e31]:
            - generic [ref=e32]: Organizations
            - generic [ref=e38]:
              - generic [ref=e39]: "2"
              - paragraph [ref=e40]: 2 parishes, 0 outstations
          - generic [ref=e41]:
            - generic [ref=e42]: Total Users
            - generic [ref=e49]:
              - generic [ref=e50]: "24"
              - paragraph [ref=e51]: 24 active (12 per org)
          - generic [ref=e52]:
            - generic [ref=e53]: Parishioners
            - generic [ref=e59]:
              - generic [ref=e60]: "291"
              - paragraph [ref=e61]: Registered members
          - generic [ref=e62]:
            - generic [ref=e63]: Total Payments
            - generic [ref=e67]:
              - generic [ref=e68]: ₦43,600
              - paragraph [ref=e69]: 12 transactions
          - generic [ref=e70]:
            - generic [ref=e71]: Mass Intentions
            - generic [ref=e77]:
              - generic [ref=e78]: "7"
              - paragraph [ref=e79]: Total booked
          - generic [ref=e80]:
            - generic [ref=e81]: Appointments
            - generic [ref=e85]:
              - generic [ref=e86]: "0"
              - paragraph [ref=e87]: Total scheduled
          - generic [ref=e88]:
            - generic [ref=e89]: Active Users %
            - generic [ref=e93]:
              - generic [ref=e94]: 100%
              - paragraph [ref=e95]: 24 of 24 users
          - generic [ref=e96]:
            - generic [ref=e97]: Avg Payments/Org
            - generic [ref=e101]:
              - generic [ref=e102]: "6"
              - paragraph [ref=e103]: per organization
        - generic [ref=e105]:
          - generic [ref=e106]:
            - heading "Structured Revenue & Transaction Breakdown" [level=3] [ref=e107]
            - generic [ref=e108]: Showing current calendar year summary
          - generic [ref=e112]:
            - generic [ref=e113]:
              - generic [ref=e114]: Online Revenue (Paystack)
              - generic [ref=e119]:
                - generic [ref=e120]: ₦43,600
                - generic [ref=e121]: Completed digital transactions routed through Paystack gateway
            - generic [ref=e122]:
              - generic [ref=e123]: Offline Revenue (Manual)
              - generic [ref=e129]:
                - generic [ref=e130]: ₦0
                - generic [ref=e131]: Completed payments recorded by staff using cash or checks
            - generic [ref=e132]:
              - generic [ref=e133]:
                - generic [ref=e134]: Manual Digital (Unverified)
                - img [ref=e136] [cursor=pointer]
              - generic [ref=e141]:
                - generic [ref=e142]: ₦0
                - generic [ref=e143]: Recorded manually as card/transfer but bypasses Paystack tracking
            - generic [ref=e144]:
              - generic [ref=e145]: Pending Payments
              - generic [ref=e151]:
                - generic [ref=e152]: ₦0
                - generic [ref=e153]:
                  - generic [ref=e154]: 0 transactions
                  - text: Initiated online payments that are not yet completed
            - generic [ref=e155]:
              - generic [ref=e156]: Failed Payments
              - generic [ref=e161]:
                - generic [ref=e162]: ₦0
                - generic [ref=e163]:
                  - generic [ref=e164]: 0 transactions
                  - text: Unsuccessful online transactions
        - generic [ref=e165]:
          - generic [ref=e166]: Admin Actions
          - generic [ref=e172]:
            - link [ref=e173] [cursor=pointer]:
              - /url: /dashboard/admin/organizations
              - button "Manage Organizations" [ref=e174]
            - link [ref=e175] [cursor=pointer]:
              - /url: /dashboard/admin/organizations/new
              - button "Create Parish" [ref=e176]
            - link [ref=e177] [cursor=pointer]:
              - /url: /dashboard/users
              - button "View All Users" [ref=e178]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e184] [cursor=pointer]:
    - generic [ref=e187]:
      - text: Compiling
      - generic [ref=e188]:
        - generic [ref=e189]: .
        - generic [ref=e190]: .
        - generic [ref=e191]: .
  - alert [ref=e192]
```