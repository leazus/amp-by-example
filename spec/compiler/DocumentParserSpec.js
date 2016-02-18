/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

describe("DocumentParser", function() {

  var DocumentParser = require('../../tasks/lib/DocumentParser').DocumentParser;
  var CodeSection = require('../../tasks/lib/CodeSection');

  var HEAD = '<head>';
  var HEAD_END = '</head>';
  var BODY = '<body>';
  var BODY_END = '</body>';
  var TAG = '<h1>hello</h1>';
  var EMPTY_LINE = ' ';
  var WRAPPED_TAG = `<h1
    class="test">
    hello
    </h1>`;
  var TITLE = '  <title>hello</title>';
  var ANOTHER_TAG = '<h1>world</h1>';
  var NESTED_TAG = `<div>
  <h1>hello</h1>
</div>`.trim();
  var NESTED_SAME_TAG = `<div>
  <div>hello</div>
</div>`.trim();
  var COMMENT = '<!--comment-->';
  var LINK = ' <link href="Hello World" />';
  var META = ' <meta href="Hello World" />';

  beforeEach(function() {
    sectionCounter = 0;
  });

  it("adds code", function() {
    expect(parse(TAG).sections[0])
      .toEqual(newSection('', TAG + '\n', ''));
  });

  it("adds comments", function() {
    expect(parse(COMMENT, TAG).sections)
      .toEqual([
          newSection('comment\n', TAG + '\n', ""),
      ]);
  });

  it("supports wrapped attributes", function() {
    var sections = parse(COMMENT, WRAPPED_TAG).sections;
    expect(sections[0].code).toEqual(WRAPPED_TAG + '\n');
  });

  describe('example spans', function() {

    it("element after comment", function() {
      expect(parse(COMMENT, TAG, ANOTHER_TAG).sections)
        .toEqual([
            newSection('comment\n', TAG + '\n', ""),
            newSection('', ANOTHER_TAG + '\n', "")
        ]);
    });

    it("nested elements after comment", function() {
      expect(parse(COMMENT, NESTED_TAG, ANOTHER_TAG).sections)
        .toEqual([
            newSection('comment\n', NESTED_TAG + '\n', ""),
            newSection('', ANOTHER_TAG + '\n', "")
        ]);
    });

    it("nested elements of same type after comment", function() {
      expect(parse(COMMENT, NESTED_SAME_TAG, ANOTHER_TAG).sections)
        .toEqual([
            newSection('comment\n', NESTED_SAME_TAG + '\n', ""),
            newSection('', ANOTHER_TAG + '\n', "")
        ]);
    });

    it("ignores empty lines", function() {
      expect(parse(COMMENT, EMPTY_LINE, TAG, ANOTHER_TAG).sections)
        .toEqual([
            newSection('comment\n', EMPTY_LINE + '\n' + TAG + '\n', ""),
            newSection('', ANOTHER_TAG + '\n', "")
        ]);
    });
  });

  it("adds content in body to preview", function() {
    var section = parse(HEAD, HEAD_END, BODY, TAG, BODY_END).sections[0];
    expect(section.preview).toEqual(TAG + '\n');
  });

  it("closes section before ending the body", function() {
    var sections = parse(HEAD, HEAD_END, BODY, TAG, BODY_END).sections;
    expect(sections.length).toEqual(2);
  });

  it("marks sections in body", function() {
    var sections = parse(HEAD, HEAD_END, BODY, COMMENT, TAG, BODY_END).sections;
    expect(sections[0].inBody).toBe(false);
    expect(sections[1].inBody).toBe(true);
  });

  it("adds head content to document", function() {
    var doc = parse(HEAD, ANOTHER_TAG, HEAD_END, BODY, TAG, BODY_END);
    expect(doc.head).toEqual(ANOTHER_TAG + '\n');
  });

  describe("single line tags", function() {
    it("link", function() {
      var doc = parse(HEAD, COMMENT, LINK, TITLE, HEAD_END);
      expect(doc.sections.length).toEqual(3);
    });
    it("meta", function() {
      var doc = parse(HEAD, COMMENT, META, TITLE, HEAD_END);
      expect(doc.sections.length).toEqual(3);
    });
  });

  it("adds title to document", function() {
    var doc = parse(HEAD, TITLE, HEAD_END);
    expect(doc.title).toEqual('hello');
  });

  describe('xml tag parsing', function() {

    beforeEach(function() {
      parser = new DocumentParser('');
    });

    it("start tag", function() {
      expect(parser.extractTag('<div>')).toEqual('div');
      expect(parser.extractTag('  <div>')).toEqual('div');
      expect(parser.extractTag('</div>')).toEqual('');
      expect(parser.extractTag('<div class="test">')).toEqual('div');
      expect(parser.extractTag('<')).toEqual('');
      expect(parser.extractTag('div')).toEqual('');
    });

    it("end tag", function() {
      expect(parser.extractEndTag('<div>')).toEqual('');
      expect(parser.extractEndTag('  <div>')).toEqual('');
      expect(parser.extractEndTag('</div>')).toEqual('div');
      expect(parser.extractEndTag('   </div>')).toEqual('div');
      expect(parser.extractEndTag('<div class="test">')).toEqual('');
    });
  });

  function newSection(comment, doc, preview) {
    var section = new CodeSection(comment, doc, preview);
    section.id = sectionCounter++;
    return section;
  }


  function parse() {
    var lines = [];
    for(var i = 0; i < arguments.length; i++) {
      lines = lines.concat(arguments[i].split('\n'));
    }
    var parser = new DocumentParser(lines);
    parser.execute();
    return parser.document;
  }

});
