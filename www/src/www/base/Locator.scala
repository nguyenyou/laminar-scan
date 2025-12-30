package www.base

import com.raquo.laminar.api.L.*
import com.raquo.laminar.codecs.{
  BooleanAsTrueFalseStringCodec,
  IntAsStringCodec,
  StringAsIsCodec
}

import scala.scalajs.LinkingInfo.developmentMode

trait Locator(using
    filename: sourcecode.FileName,
    file: sourcecode.File,
    line: sourcecode.Line,
    n: sourcecode.Name
) {
  private val fileName = filename.value
  private val filePath = file.value
  private val lineNumber = line.value
  private val name = n.value

  def modifiers(element: HtmlElement): HtmlElement = {
    Locator.attachSourceInfo(
      element = element,
      fileName = fileName,
      filePath = filePath,
      lineNumber = lineNumber,
      name = name
    )
  }

  def componentName: String = {
    if (developmentMode) {
      filePath
    } else {
      fileName
    }

  }

}

object Locator {

  private lazy val scalaSourcePath =
    htmlProp("__scalasourcepath", StringAsIsCodec)

  private lazy val scalaFileName =
    htmlProp("__scalafilename", StringAsIsCodec)

  private lazy val scalaLineNumber =
    htmlProp("__scalasourceline", IntAsStringCodec)

  private lazy val scalaName =
    htmlProp("__scalaname", StringAsIsCodec)

  private lazy val markAsComponent =
    htmlProp("__markascomponent", BooleanAsTrueFalseStringCodec)

  def attachSourceInfo(
      element: HtmlElement,
      markAsComponent: Boolean = false,
      fileName: String,
      filePath: String,
      lineNumber: Int,
      name: String
  ): HtmlElement = {
    if (developmentMode) {
      element.amend(
        Locator.scalaFileName := fileName,
        Locator.scalaSourcePath := filePath,
        Locator.scalaLineNumber := lineNumber,
        Locator.scalaName := name,
        Locator.markAsComponent := markAsComponent,
        dataAttr("scala") := s"${fileName}${
            if (markAsComponent) s"#${name}" else ""
          }:${lineNumber}"
      )
    }
    element
  }

}
