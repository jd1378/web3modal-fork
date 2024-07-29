import { expect, test, type BrowserContext } from '@playwright/test'
import { ModalWalletPage } from './shared/pages/ModalWalletPage'
import { Email } from './shared/utils/email'
import { ModalWalletValidator } from './shared/validators/ModalWalletValidator'

/* eslint-disable init-declarations */
let page: ModalWalletPage
let validator: ModalWalletValidator
let context: BrowserContext
/* eslint-enable init-declarations */

// -- Setup --------------------------------------------------------------------
const walletFeaturesTest = test.extend<{ library: string }>({
  library: ['wagmi', { option: true }]
})

walletFeaturesTest.describe.configure({ mode: 'serial' })

walletFeaturesTest.beforeAll(async ({ browser, library }, testInfo) => {
  context = await browser.newContext()
  const browserPage = await context.newPage()

  page = new ModalWalletPage(browserPage, library, 'email')
  validator = new ModalWalletValidator(browserPage)

  await page.load()

  const mailsacApiKey = process.env['MAILSAC_API_KEY']
  if (!mailsacApiKey) {
    throw new Error('MAILSAC_API_KEY is not set')
  }
  const email = new Email(mailsacApiKey)
  const tempEmail = email.getEmailAddressToUse(testInfo.parallelIndex)
  await page.emailFlow(tempEmail, context, mailsacApiKey)

  await validator.expectConnected()
})

walletFeaturesTest.afterAll(async () => {
  await page.page.close()
})

walletFeaturesTest('it should initialize swap as expected', async () => {
  await page.openAccount()
  const walletFeatureButton = await page.getWalletFeaturesButton('swap')
  await walletFeatureButton.click()
  await expect(page.page.getByTestId('swap-input-sourceToken')).toHaveValue('1')
  await expect(page.page.getByTestId('swap-input-token-sourceToken')).toHaveText('ETH')
  await page.page.getByTestId('swap-select-token-button-toToken').click()
  await page.page
    .getByTestId('swap-select-token-search-input')
    .getByPlaceholder('Search token')
    .fill('USDC')
  await page.page.getByTestId('swap-select-token-item-USDC').click()
  await expect(page.page.getByTestId('swap-action-button')).toHaveText('Insufficient balance')
  await page.closeModal()
})

walletFeaturesTest('it should initialize onramp as expected', async () => {
  await page.openAccount()
  const walletFeatureButton = await page.getWalletFeaturesButton('onramp')
  await walletFeatureButton.click()
  await expect(page.page.getByText('Coinbase')).toBeVisible()
  await page.closeModal()
})

walletFeaturesTest('it should initialize receive as expected', async () => {
  await page.openAccount()
  const walletFeatureButton = await page.getWalletFeaturesButton('receive')
  await walletFeatureButton.click()
  await page.page.getByTestId('receive-address-copy-button').click()
  await expect(page.page.getByText('Address copied')).toBeVisible()
  await page.closeModal()
})