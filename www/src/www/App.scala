package www

import com.raquo.laminar.api.L.*
import base.LaminarComponent

case class App() extends LaminarComponent {
  val count = Var(0)
  def render(): HtmlElement = {
    div(
      cls("h-screen w-screen flex justify-center items-center"),
      div(
        div(
          "Count: ",
          child.text <-- count.signal
        ),
        button(
          onClick --> Observer { _ =>
            count.update(_ + 1)
          },
          "Click me"
        )
      )
    )
  }
}
