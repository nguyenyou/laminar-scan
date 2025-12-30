package www

import com.raquo.laminar.api.L.*

case class App() {
  def apply(): HtmlElement = {
    div(
      cls("h-screen w-screen flex justify-center items-center"),
      "Hello, World!"
    )
  }
}
