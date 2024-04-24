import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    this.billId = null
    this.fileName = null
    this.fileUrl = null

    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    const file = this.document.querySelector(`input[data-testid="file"]`)

    formNewBill.addEventListener("submit", this.handleSubmit)
    file.addEventListener("change", this.handleChangeFile)

    new Logout({ document, localStorage, onNavigate })
  }

  handleChangeFile = (e) => {
    e.preventDefault()

    const file = this.document.querySelector(`input[data-testid="file"]`).files[0]

    // Check if a file is selected
    if (!file) {
      console.error('No file selected')
      return
    }

    const fileExtension = file.name.split(".").pop().toLowerCase() // Get the file extension
    const allowedExtensions = ["jpg", "jpeg", "png", "gif"] // Define allowed file extensions

    // Check if the file extension is allowed
    if (!allowedExtensions.includes(fileExtension)) {
      console.error("Invalid file extension")
      return
    }

    // Continue with the file upload
    const filePath = e.target.value.split(/\\/g)
    const fileName = filePath[filePath.length-1]
    const formData = new FormData()
    const email = JSON.parse(localStorage.getItem("user")).email

    formData.append('file', file)
    formData.append('email', email)

    this.store
      .bills()
      .create({
        data: formData,
        headers: { noContentType: true }
      })
      .then(({fileUrl, key}) => {
        console.log(fileUrl)
        this.billId = key
        this.fileUrl = fileUrl
        this.fileName = fileName
      })
      .catch((error) => console.error(error))
  }

  handleSubmit = (e) => {
    e.preventDefault()
    console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)

    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }

    this.updateBill(bill)
    this.onNavigate(ROUTES_PATH['Bills'])
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})
      .then(() => { this.onNavigate(ROUTES_PATH['Bills']) })
      .catch((error) => console.error(error))
    }
  }
}
