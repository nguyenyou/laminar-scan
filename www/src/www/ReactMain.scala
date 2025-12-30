package www

import japgolly.scalajs.react.*
import org.scalajs.dom

def MainReactApp(): Unit = {
  val container = dom.document.getElementById("app")
  ReactDOMClient
    .createRoot(container)
    .render(
      React.StrictMode(
        ReactApp()()
      )
    )
}
