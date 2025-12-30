package www

import com.raquo.laminar.api.L.*
import base.LaminarComponent

case class App() extends LaminarComponent {
  def render(): HtmlElement = {
    div(
      cls("h-screen w-screen flex justify-center items-center"),
      Counter()
    )
  }
}
