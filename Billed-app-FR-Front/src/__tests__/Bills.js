/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"

import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js"
import { ROUTES_PATH } from "../constants/routes.js"
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
  })
})
