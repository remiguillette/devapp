(function (global) {
  if (!global || !global.React) {
    return;
  }

  var React = global.React;
  var createElement = React.createElement;
  var forwardRef = React.forwardRef || function (renderFn) {
    return function ForwardRefComponent(props) {
      return renderFn(props, null);
    };
  };

  function classNames() {
    var classes = [];
    for (var i = 0; i < arguments.length; i++) {
      var value = arguments[i];
      if (!value) continue;
      classes.push(String(value));
    }
    return classes.join(' ');
  }

  function createLucideIcon(iconName, iconNode) {
    var Icon = forwardRef(function (
      _ref,
      forwardedRef
    ) {
      var _ref$color = _ref.color,
        color = _ref$color === void 0 ? 'currentColor' : _ref$color;
      var _ref$size = _ref.size,
        size = _ref$size === void 0 ? 24 : _ref$size;
      var _ref$strokeWidth = _ref.strokeWidth,
        strokeWidth = _ref$strokeWidth === void 0 ? 2 : _ref$strokeWidth;
      var className = _ref.className === void 0 ? '' : _ref.className;
      var children = _ref.children;
      var rest = {};
      for (var key in _ref) {
        if (
          Object.prototype.hasOwnProperty.call(_ref, key) &&
          ['color', 'size', 'strokeWidth', 'className', 'children'].indexOf(key) ===
            -1
        ) {
          rest[key] = _ref[key];
        }
      }

      var iconChildren = iconNode.map(function (node, index) {
        var tag = node[0];
        var attrs = node[1];
        return createElement(tag, Object.assign({ key: index }, attrs));
      });

      if (children) {
        if (Array.isArray(children)) {
          iconChildren = iconChildren.concat(children);
        } else {
          iconChildren.push(children);
        }
      }

      return createElement(
        'svg',
        Object.assign(
          {
            ref: forwardedRef,
            xmlns: 'http://www.w3.org/2000/svg',
            width: size,
            height: size,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: color,
            strokeWidth: strokeWidth,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            className: classNames('lucide', 'lucide-' + iconName.toLowerCase(), className),
            focusable: 'false',
          },
          rest
        ),
        iconChildren
      );
    });

    Icon.displayName = iconName;
    return Icon;
  }

  var icons = {
    Smartphone: createLucideIcon('Smartphone', [
      ['rect', { width: 14, height: 20, x: 5, y: 2, rx: 2, ry: 2 }],
      ['path', { d: 'M12 18h.01' }],
    ]),
    Home: createLucideIcon('Home', [
      ['path', { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8' }],
      [
        'path',
        {
          d: 'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
        },
      ],
    ]),
    Shield: createLucideIcon('Shield', [
      [
        'path',
        {
          d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
        },
      ],
    ]),
    FileText: createLucideIcon('FileText', [
      [
        'path',
        { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
      ],
      ['polyline', { points: '14 2 14 8 20 8' }],
      ['line', { x1: 16, y1: 13, x2: 8, y2: 13 }],
      ['line', { x1: 16, y1: 17, x2: 8, y2: 17 }],
      ['line', { x1: 10, y1: 9, x2: 8, y2: 9 }],
    ]),
    Network: createLucideIcon('Network', [
      ['rect', { x: 16, y: 16, width: 6, height: 6, rx: 1 }],
      ['rect', { x: 2, y: 16, width: 6, height: 6, rx: 1 }],
      ['rect', { x: 9, y: 2, width: 6, height: 6, rx: 1 }],
      ['path', { d: 'M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3' }],
      ['path', { d: 'M12 12V8' }],
    ]),
  };

  global.LucideReact = {
    createLucideIcon: createLucideIcon,
    icons: icons,
  };
})(typeof window !== 'undefined' ? window : globalThis);
