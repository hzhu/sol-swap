[x] show users balance under sell input
[x] API quote call are from our own backend
[x] API swap call are from our own backend
[x] refactor state to reduce double state when selecting token
[x] bug when a user selects the opposite token, flip the two.
[x] can swap
[x] input value validation rules
[x] show token image when token is selected
[x] mobile works!
[x] flip direction button works
[x] doesn't show balance if zero
[x] successful swap... opens a modal dialog with details?
[x] and confetti
[x] refactor state into useReducer
[x] error UI for swap
[x] should have insufficient balance error when selling more than balance
[x] add spinner to swapping and fetching button
[x] fix broken keyboard navigation styling on comboboxes
[x] refactor selected sell token + selected symbol to reducer
[x] handles insufficient balance to sell
[x] general refactor to clean up reducer state
[x] move reducer into its own file
[x] clicking trade direction should only make a single fetch to /quote
[x] disabled swap button when user types an amount for a token they do not own
[x] refactor and create useBalance
[x] refactor and create useQuote + remove fetching state from reducer
[x] refactor everything that can be moved to react-query
[x] introduce iOS-style modal sheet
[x] implement mobile combobox
[x] swipe down at the beginning of list should not dismiss sheet
[x] only show insufficient balance message is wallet is connected
[x] sell token search button should open bottom sheet
[x] restructure mobile designs: create modal + sheet trigger
[x] selecting the same opposite token should flip the trade direction
[x] add warning icon to insufficient balance
[x] add max button ui
[x] add max button ui logic
[x] token search trigger should have all button states

[x] create useQuote for quote from LiFi
[x] create reducer and plug in values necessary for useQuote
[x] get allowance + render approval button if needed
[x] fetching state (I think populating button is prob best approach)
[x] approve LiFi for bridging the tx
[x] fetch balance of usdc on evm
[x] show insufficient balance (again in button)
[x] ability to single click "max" button
[x] bridge SOL from EVM (they need gas money!)
[ ] add pencil / edit icon
[ ] introduce single accordion or disclosure component
[ ] style review modal
[ ] on mobile, use iOS sheet for review modal
[ ] test our solflare workflow
[ ] migrate to use metamask snap-solflare

[ ] info popover shows :check: approval and spending allowance
[ ] ability for users to revoke
[ ] create single direction button for bridging ui
[ ] add x-chain icons to ui
[ ] https://thorchain.org/
[ ] can connect to phantom wallet on mobile phone
[ ] direction button should have all button states
[ ] input should have focus state
[ ] loading skeleton for when receive amount is pending
[ ] introduce font-awesome
[ ] add 🔍 and chevron svg icon
[ ] close button for bottom sheet should have some affordance (button states)
[ ] add pending state to balance fetch so doesn't flash 0
[ ] broken image should have a fallback
[ ] tokenlist: dynamically fetch token list
[ ] tokenlist: async defer the token list
[ ] tokenlist: persist token list in index db
[ ] can search by addresacks
[ ] handles unconnected state?
[ ] handles reverts?
[ ] handless API errors from Jupiter
[ ] store transactions in local storage or even better in a cookie string
[ ] tab shows transaction history
[ ] store transactions in pocketbase or indexDB
[ ] support coinbase wallet
[ ] handle 500 errors for /quote
[ ] works well as a PWA
[ ] make design look gud
[ ] can sell entire balance including dust
[ ] show price impact
[ ] allow user to set slippage
[ ] show route plan
[ ] dark mode
[ ] i18n
