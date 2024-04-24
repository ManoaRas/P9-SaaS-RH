/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"

import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js"
import { ROUTES_PATH } from "../constants/routes.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import BillsUI from "../views/BillsUI.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test('Then bill icon in vertical layout should be highlighted', async () => {
      // Set up local storage for employee authentication
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

      // Create a root element for rendering and append it to the document
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)

      // Set up the router and navigate to the Bills page
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      // Wait for the window icon to be rendered
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      // Add assertion
      expect(windowIcon.classList).toContain("active-icon")
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map((a) => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("fetch all bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))
      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByText("Mes notes de frais"))

      expect(screen.getByTestId("btn-new-bill")).toBeTruthy()
    })
  })

  /* Adding expect for error page for cover report 100% (views/BillsUI.js) */
  describe("When there is an error while retrieving data via the API", () => {
    // Before each bills, similar and tracks calls
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")

      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee",
        email: "a@a",
      }))

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    test("Then fetch all bills from API GET return an error 404", async () => {
      mockStore.bills.mockImplementation(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          },
        }
      })

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)

      const message = screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("Then fetch all bills from API GET return an error 500", async () => {
      mockStore.bills.mockImplementation(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          },
        }
      })

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)

      const message = screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })

  /* Adding unit and integration test for cover report to be green (containers/Bills.js) */
  describe("When I click on the iconEye button", () => {
    // Testing if modal was open after click in the iconEye
    test("Then a modal should open", () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }))

      document.body.innerHTML = BillsUI({ data: bills })

      const objBills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      $.fn.modal = jest.fn()

      const iconEye = screen.getAllByTestId("icon-eye")[0]
      const handleClickIconEye = jest.fn(objBills.handleClickIconEye(iconEye))

      iconEye.addEventListener("click", handleClickIconEye)
      userEvent.click(iconEye)

      const modal = document.getElementById("modaleFile")

      expect(handleClickIconEye).toHaveBeenCalled()
      expect(modal).toBeTruthy()
    })
  })

  // Testing if handleClickNewBill was call"
  describe("When i click on new bill button", () => {
    test("Then It should be sent to the new bill page", async () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee",
      }))

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByTestId("btn-new-bill"))

      const bills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      const newBillButton = screen.getByTestId("btn-new-bill")
      const handleClickNewBill = jest.fn(bills.handleClickNewBill())
      newBillButton.addEventListener("click", handleClickNewBill)

      userEvent.click(newBillButton)
      expect(handleClickNewBill).toHaveBeenCalled()
    })
  })
})
