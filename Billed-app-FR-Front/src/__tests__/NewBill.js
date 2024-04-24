/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom"
import { fireEvent, screen, waitFor } from "@testing-library/dom"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store.js"
import router from "../app/Router.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import NewBill from "../containers/NewBill.js"
import NewBillUI from "../views/NewBillUI.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  // Config localStorage before each test
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock })

    window.localStorage.setItem("user", JSON.stringify({
      type: "Employee",
      email: "a@a",
    }))
  })

  describe("When I am on NewBill Page", () => {
    // Check if the mail icon is highlighted on the NewBill page
    test("Then mail icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)

      router()
      window.onNavigate(ROUTES_PATH.NewBill)

      await waitFor(() => screen.getByTestId("icon-mail"))
      const mailIcon = screen.getByTestId("icon-mail")

      expect(mailIcon.classList).toContain("active-icon")
    })

    // Check if the form is correctly displayed
    test("Then the form should be displayed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      expect(screen.getByTestId("form-new-bill")).toBeInTheDocument()
      expect(screen.getByTestId("expense-type")).toBeInTheDocument()
      expect(screen.getByTestId("expense-name")).toBeInTheDocument()
      expect(screen.getByTestId("datepicker")).toBeInTheDocument()
      expect(screen.getByTestId("amount")).toBeInTheDocument()
      expect(screen.getByTestId("vat")).toBeInTheDocument()
      expect(screen.getByTestId("pct")).toBeInTheDocument()
      expect(screen.getByTestId("commentary")).toBeInTheDocument()
      expect(screen.getByTestId("file")).toBeInTheDocument()
      expect(screen.getByRole("button")).toBeInTheDocument()
    })
  })

  describe("When I fill the form ", () => {
    let newBill

    beforeEach(() => {
      document.body.innerHTML = NewBillUI()
      const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }

      newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })
    })

    describe("When I upload a file", () => {
      let handleChangeFile

      beforeEach(() => { handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e)) })

      // Check if the right file is selected
      test("Then right file should be selected", async () => {
        await waitFor(() => screen.getByTestId("file"))

        const inputFile = screen.getByTestId("file")
        const testFile = new File(["test"], "test.jpg", { type: "image/jpg" })

        inputFile.addEventListener("change", handleChangeFile)
        fireEvent.change(inputFile, { target: { files: [testFile] } })

        expect(screen.getByTestId("file").files[0].name).toBe("test.jpg")
        expect(handleChangeFile).toHaveBeenCalled()
        expect(inputFile.files[0]).toEqual(testFile)
      })

      // Check if a file is selected
      test("Then a file should be selected", async () => {
        const mockEvent = {
          preventDefault: jest.fn(),
          target: {
            value: "fakepath\\fakefile.jpg",
            files: [
              new File(["fileContent"], "fakefile.jpg", { type: "image/jpeg" }),
            ],
          },
        }

        handleChangeFile(mockEvent)

        expect(handleChangeFile).toHaveBeenCalled()
      })

      // Check if an error is triggered when uploading a wrong file
      test("Then upload a wrong file should trigger an error", async () => {
        const inputFile = screen.getByTestId("file")
        const testFile = new File(["test"], "test.pdf", { type: "document/pdf" })
        const errorSpy = jest.spyOn(console, "error")

        inputFile.addEventListener("change", handleChangeFile)
        fireEvent.change(inputFile, { target: { files: [testFile] } })

        expect(errorSpy).toHaveBeenCalledWith("Invalid file extension")
      })
    })

    describe("When I click on the submit button", () => {
      // Check if a new bill is created
      test("Then it should create a new bill", async () => {
        const html = NewBillUI()
        document.body.innerHTML = html

        const mockLocalStorage = {
          getItem: jest.fn(() => JSON.stringify({ email: "test@example.com" })),
        }

        const mockStore = {
          bills: jest.fn(() => ({
            create: jest.fn(() => Promise.resolve()),
          })),
        }

        const mockOnNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate: mockOnNavigate,
          store: mockStore,
          localStorage: mockLocalStorage,
        })

        const sampleBill = {
          type: "Transports",
          name: "Vol Paris-Brest",
          date: "2024-02-10",
          amount: 42,
          vat: "10",
          pct: 15,
          commentary: "test bill",
          status: "pending",
          fileName: "image.jpg",
        }

        screen.getByTestId("expense-type").value = sampleBill.type
        screen.getByTestId("expense-name").value = sampleBill.name
        screen.getByTestId("datepicker").value = sampleBill.date
        screen.getByTestId("amount").value = sampleBill.amount
        screen.getByTestId("vat").value = sampleBill.vat
        screen.getByTestId("pct").value = sampleBill.pct
        screen.getByTestId("commentary").value = sampleBill.commentary

        newBill.fileName = sampleBill.fileName
        newBill.updateBill = jest.fn()

        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))

        const form = screen.getByTestId("form-new-bill")
        form.addEventListener("submit", handleSubmit)
        fireEvent.submit(form)

        expect(handleSubmit).toHaveBeenCalled()
        expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"])
      })
    })
  })
})
