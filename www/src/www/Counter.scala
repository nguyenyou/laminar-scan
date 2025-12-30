package www

import com.raquo.laminar.api.L.*
import base.LaminarComponent

case class Counter() extends LaminarComponent {
  val count = Var(0)

  def render(): HtmlElement = {
    div(
      cls("flex flex-col gap-4 p-6 border border-gray-300 rounded-lg"),
      div(
        cls("text-2xl font-bold"),
        "Count: ",
        child.text <-- count.signal
      ),
      button(
        cls("px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"),
        onClick --> Observer { _ =>
          count.update(_ + 1)
        },
        "Increment"
      ),
      button(
        cls("px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"),
        onClick --> Observer { _ =>
          count.update(_ - 1)
        },
        "Decrement"
      ),
      button(
        cls("px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"),
        onClick --> Observer { _ =>
          count.set(0)
        },
        "Reset"
      )
    )
  }
}
