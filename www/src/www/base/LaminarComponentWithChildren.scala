package www.base

import com.raquo.laminar.api.L.*

trait LaminarComponentWithChildren extends UIComponent {
  def render(children: HtmlElement*): HtmlElement

  def apply(children: HtmlElement*): HtmlElement = {
    modifiers(render(children*))
  }

}
