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
[x] general refactor to clean up reducer state
[x] move reducer into its own file
[x] clicking trade direction should only make a single fetch to /quote
[ ] disabled swap button when user types an amount for a token they do not own
[ ] max button populates the sell input
[ ] show "trending" suggestions as the initial suggestions
[ ] dynamically fetch token list
[ ] handles unconnected state?
[ ] handles insufficient balance to sell
[ ] handles reverts?
[ ] handless API errors from Jupiter
[ ] async defer the token list
[ ] store transactions in local storage or even better in a cookie string
[ ] tab shows transaction history
[ ] store transactions in pocketbase
[ ] support coinbase wallet
[ ] handle 500 errors for /quote
