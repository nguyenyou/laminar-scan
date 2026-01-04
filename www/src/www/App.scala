package www

import com.raquo.laminar.api.L.*
import base.LaminarComponent

case class App() extends LaminarComponent {
  def render(): HtmlElement = {
    div(
      laminar.devtools.Devtools,
      cls("w-screen h-screen grid place-items-center"),
      div(
        cls("flex gap-2"),
        div(
          cls("flex flex-col gap-2"),
          FPSKiller(),
          MemoryLeaker()
        ),
        MutationDemo()
      )
    )
  }
}
