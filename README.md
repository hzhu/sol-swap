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
[x] sell token search button should open bottom sheet
[-] restructure mobile designs: create modal + sheet trigger
[ ] animate and turn chevron for token search buttons
[x] selecting the same opposite token should flip the trade direction
[ ] add 🔍 and chevron svg icon
[ ] token search trigger should have all button states
[ ] broken image should have a fallback
[x] only show insufficient balance message is wallet is connected
[ ] max button populates the sell input
[ ] tokelist: dynamically fetch token list
[ ] tokelist: async defer the token list
[ ] tokelist: persist token list in index db
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
