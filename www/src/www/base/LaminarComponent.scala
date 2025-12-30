package www.base

import com.raquo.laminar.api.L.*
import com.raquo.laminar.modifiers.KeySetter.HtmlAttrSetter
import com.raquo.laminar.modifiers.KeyUpdater.HtmlAttrUpdater
import com.raquo.laminar.modifiers.RenderableNode

trait LaminarComponent extends UIComponent {
  def render(): HtmlElement

  // RenderableNode
  lazy val element: HtmlElement = modifiers(render())

  // Legacy - Backwards compatibility
  def apply(): HtmlElement = element
}

object LaminarComponent {

  /** Implicit RenderableNode instance that allows LaminarComponent to be used
    * directly in Laminar code without calling .element.
    *
    * This enables usage like: `div(laminarComponent)` instead of
    * `div(laminarComponent.element)`
    */
  implicit val renderableNode: RenderableNode[LaminarComponent] =
    RenderableNode(_.element)

  extension (element: HtmlElement) {

    /** Attaching source info to the element for frontend devtools usage.
      */
    inline def markAsComponent: HtmlElement = {
      Locator.attachSourceInfo(
        element = element,
        markAsComponent = true,
        fileName = sourcecode.FileName(),
        filePath = sourcecode.File(),
        lineNumber = sourcecode.Line(),
        name = sourcecode.Name()
      )
    }

  }

}
