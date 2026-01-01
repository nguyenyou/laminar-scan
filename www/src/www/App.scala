package www

import com.raquo.laminar.api.L.*
import base.LaminarComponent

case class App() extends LaminarComponent {
  def render(): HtmlElement = {
    div(
      cls(
        "min-h-screen w-screen flex flex-col justify-center items-center gap-8 py-8"
      ),
      div(
        cls("text-center mb-4"),
        h1(cls("text-2xl font-bold text-gray-800"), "DevTools Demo"),
        p(
          cls("text-gray-600"),
          "Use these components to test the FPS, Memory, and MutationScanner"
        )
      ),
      MutationDemo(),
      div(
        cls("flex flex-wrap gap-6 justify-center"),
        FPSKiller(),
        MemoryLeaker()
      )
    )
  }
}
