# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p0-session-policy.spec.ts >> P0 — Session policy, both directions >> Staff session 30-minute idle timeout triggers sign out on next request
- Location: e2e\p0-session-policy.spec.ts:33:6

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e2]:
    - link [ref=f1e3] [cursor=pointer]:
      - /url: /
      - img "logo" [ref=f1e4]
    - button [ref=f1e5]
  - generic [ref=f1e9]:
    - generic [ref=f1e11]:
      - img "logo" [ref=f1e13]
      - generic [ref=f1e14]:
        - link "SA System Admin SUPER ADMIN" [ref=f1e15] [cursor=pointer]:
          - /url: /profile
          - generic [ref=f1e16]: SA
          - generic [ref=f1e18]:
            - paragraph [ref=f1e20]: System Admin
            - generic [ref=f1e21]: SUPER ADMIN
        - button [ref=f1e22]
    - main [ref=f1e24]:
      - generic [ref=f1e26]:
        - generic [ref=f1e27]:
          - heading "System Dashboard" [level=1] [ref=f1e28]
          - paragraph [ref=f1e29]: Platform-wide overview and administration
        - generic [ref=f1e30]:
          - generic [ref=f1e31]:
            - generic [ref=f1e32]: Organizations
            - generic [ref=f1e38]:
              - generic [ref=f1e39]: "2"
              - paragraph [ref=f1e40]: 2 parishes, 0 outstations
          - generic [ref=f1e41]:
            - generic [ref=f1e42]: Total Users
            - generic [ref=f1e49]:
              - generic [ref=f1e50]: "24"
              - paragraph [ref=f1e51]: 24 active (12 per org)
          - generic [ref=f1e52]:
            - generic [ref=f1e53]: Parishioners
            - generic [ref=f1e59]:
              - generic [ref=f1e60]: "291"
              - paragraph [ref=f1e61]: Registered members
          - generic [ref=f1e62]:
            - generic [ref=f1e63]: Total Payments
            - generic [ref=f1e67]:
              - generic [ref=f1e68]: ₦43,600
              - paragraph [ref=f1e69]: 12 transactions
          - generic [ref=f1e70]:
            - generic [ref=f1e71]: Mass Intentions
            - generic [ref=f1e77]:
              - generic [ref=f1e78]: "7"
              - paragraph [ref=f1e79]: Total booked
          - generic [ref=f1e80]:
            - generic [ref=f1e81]: Appointments
            - generic [ref=f1e85]:
              - generic [ref=f1e86]: "0"
              - paragraph [ref=f1e87]: Total scheduled
          - generic [ref=f1e88]:
            - generic [ref=f1e89]: Active Users %
            - generic [ref=f1e93]:
              - generic [ref=f1e94]: 100%
              - paragraph [ref=f1e95]: 24 of 24 users
          - generic [ref=f1e96]:
            - generic [ref=f1e97]: Avg Payments/Org
            - generic [ref=f1e101]:
              - generic [ref=f1e102]: "6"
              - paragraph [ref=f1e103]: per organization
        - generic [ref=f1e105]:
          - generic [ref=f1e106]:
            - heading "Structured Revenue & Transaction Breakdown" [level=3] [ref=f1e107]
            - generic [ref=f1e108]: Showing current calendar year summary
          - generic [ref=f1e112]:
            - generic [ref=f1e113]:
              - generic [ref=f1e114]: Online Revenue (Paystack)
              - generic [ref=f1e119]:
                - generic [ref=f1e120]: ₦43,600
                - generic [ref=f1e121]: Completed digital transactions routed through Paystack gateway
            - generic [ref=f1e122]:
              - generic [ref=f1e123]: Offline Revenue (Manual)
              - generic [ref=f1e129]:
                - generic [ref=f1e130]: ₦0
                - generic [ref=f1e131]: Completed payments recorded by staff using cash or checks
            - generic [ref=f1e132]:
              - generic [ref=f1e133]:
                - generic [ref=f1e134]: Manual Digital (Unverified)
                - img [ref=f1e136] [cursor=pointer]
              - generic [ref=f1e141]:
                - generic [ref=f1e142]: ₦0
                - generic [ref=f1e143]: Recorded manually as card/transfer but bypasses Paystack tracking
            - generic [ref=f1e144]:
              - generic [ref=f1e145]: Pending Payments
              - generic [ref=f1e151]:
                - generic [ref=f1e152]: ₦0
                - generic [ref=f1e153]:
                  - generic [ref=f1e154]: 0 transactions
                  - text: Initiated online payments that are not yet completed
            - generic [ref=f1e155]:
              - generic [ref=f1e156]: Failed Payments
              - generic [ref=f1e161]:
                - generic [ref=f1e162]: ₦0
                - generic [ref=f1e163]:
                  - generic [ref=f1e164]: 0 transactions
                  - text: Unsuccessful online transactions
        - generic [ref=f1e165]:
          - generic [ref=f1e166]: Admin Actions
          - generic [ref=f1e172]:
            - link [ref=f1e173] [cursor=pointer]:
              - /url: /dashboard/admin/organizations
              - button "Manage Organizations" [ref=f1e174]
            - link [ref=f1e175] [cursor=pointer]:
              - /url: /dashboard/admin/organizations/new
              - button "Create Parish" [ref=f1e176]
            - link [ref=f1e177] [cursor=pointer]:
              - /url: /dashboard/users
              - button "View All Users" [ref=f1e178]
  - region "Notifications alt+T"
```