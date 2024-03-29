'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var PropTypes = require('prop-types');
var createReactClass = require('create-react-class');
var Input = require('./input');
var AriaStatus = require('./aria_status');
var getTextDirection = require('../utils/get_text_direction');
var noop = function () {};

var Typeahead = createReactClass({
    displayName: 'Typeahead',

    propTypes: process.env.NODE_ENV === 'production' ? {} : {
        inputId: PropTypes.string,
        inputName: PropTypes.string,
        className: PropTypes.string,
        autoFocus: PropTypes.bool,
        hoverSelect: PropTypes.bool,
        inputValue: PropTypes.string,
        options: PropTypes.array,
        placeholder: PropTypes.string,
        onChange: PropTypes.func,
        onKeyDown: PropTypes.func,
        onKeyPress: PropTypes.func,
        onKeyUp: PropTypes.func,
        onFocus: PropTypes.func,
        onBlur: PropTypes.func,
        onSelect: PropTypes.func,
        onInputClick: PropTypes.func,
        handleHint: PropTypes.func,
        onComplete: PropTypes.func,
        onOptionClick: PropTypes.func,
        onOptionChange: PropTypes.func,
        onDropdownOpen: PropTypes.func,
        onDropdownClose: PropTypes.func,
        optionTemplate: PropTypes.func.isRequired,
        getMessageForOption: PropTypes.func,
        getMessageForIncomingOptions: PropTypes.func,
        uniqueId: PropTypes.string
    },

    getDefaultProps: function() {
        return {
            className: '',
            inputValue: '',
            options: [],
            hoverSelect: true,
            onFocus: noop,
            onKeyDown: noop,
            onChange: noop,
            onInputClick: noop,
            handleHint: function() {
                return '';
            },
            onOptionClick: noop,
            onOptionChange: noop,
            onComplete:  noop,
            onDropdownOpen: noop,
            onDropdownClose: noop,
            getMessageForOption: function() {
                return '';
            },
            getMessageForIncomingOptions: function(number) {
                return (
                    number + ' suggestions are available. Use up and down arrows to select.'
                );
            }
        };
     },

    getInitialState: function() {
        return {
            selectedIndex: -1,
            isHintVisible: false,
            isDropdownVisible: false
        };
    },

    componentDidMount: function() {
        // Begin code that was in componentWillMount, which got deprecated
        var _this = this;
        var uniqueId = this.props.uniqueId || '1';

        _this.userInputValue = null;
        _this.previousInputValue = null;
        _this.activeDescendantId = 'react-typeahead-activedescendant-' + uniqueId;
        _this.optionsId = 'react-typeahead-options-' + uniqueId;
        // End code that was in componentWillMount

        var addEvent = window.addEventListener,
            handleWindowClose = this.handleWindowClose;

        // The `focus` event does not bubble, so we must capture it instead.
        // This closes Typeahead's dropdown whenever something else gains focus.
        addEvent('focus', handleWindowClose, true);

        // If we click anywhere outside of Typeahead, close the dropdown.
        addEvent('click', handleWindowClose, false);
    },

    componentWillUnmount: function() {
        var removeEvent = window.removeEventListener,
            handleWindowClose = this.handleWindowClose;

        removeEvent('focus', handleWindowClose, true);
        removeEvent('click', handleWindowClose, false);
    },

    // The componentWillReceiveProps function only handled calling handleHint, which we're not using anyway
    //      so we could simply remove componentWillReceiveProps when it was being deprecated

    render: function() {
        var _this = this;

        return (
            React.createElement("div", {
                style: {
                    position: 'relative'
                },
                className: 'react-typeahead-container ' + _this.props.className},
                _this.renderInput(),
                _this.renderDropdown(),
                _this.renderAriaMessageForOptions(),
                _this.renderAriaMessageForIncomingOptions()
            )
        );
    },

    renderInput: function() {
        var _this = this,
            state = _this.state,
            props = _this.props,
            inputValue = props.inputValue,
            className = 'react-typeahead-input',
            inputDirection = getTextDirection(inputValue);

        var style = this.props.style || {};

        var inputStyle = Object.assign({}, {
            position: 'relative'
        }, this.props.inputStyle);

        var hintStyle = Object.assign({}, {
            position: 'absolute'
        }, this.props.inputStyle);

        return (
            React.createElement("div", {
                style: style,
                className: this.props.className || "react-typeahead-input-container"},
                React.createElement(Input, Object.assign({}, {
                    disabled: true,
                    role: "presentation",
                    "aria-hidden": true,
                    dir: inputDirection,
                    className: this.props.inputClassName || (className + ' react-typeahead-hint'),
                    style: hintStyle,
                    value: state.isHintVisible ? props.handleHint(inputValue, props.options) : ''
                }, this.props.inputProps)),
                React.createElement(Input, Object.assign({}, {
                    role: "combobox",
                    "aria-owns": _this.optionsId,
                    "aria-expanded": state.isDropdownVisible,
                    "aria-autocomplete": "both",
                    "aria-activedescendant": _this.activeDescendantId,
                    value: inputValue,
                    spellCheck: false,
                    autoComplete: 'off',
                    autoCorrect: 'off',
                    dir: inputDirection,
                    onClick: _this.handleClick,
                    onFocus: _this.handleFocus,
                    onBlur: props.onBlur,
                    onChange: _this.handleChange,
                    onKeyDown: _this.handleKeyDown,
                    id: props.inputId,
                    name: props.inputName,
                    autoFocus: props.autoFocus,
                    placeholder: props.placeholder,
                    onSelect: props.onSelect,
                    onKeyUp: props.onKeyUp,
                    onKeyPress: props.onKeyPress,
                    className: this.props.inputClassName || (className + ' react-typeahead-usertext'),
                    style: inputStyle,
                    }, this.props.inputProps))
            )
        );
    },

    renderDropdown: function() {
        var _this = this,
            state = _this.state,
            props = _this.props,
            OptionTemplate = props.optionTemplate,
            selectedIndex = state.selectedIndex,
            isDropdownVisible = state.isDropdownVisible,
            activeDescendantId = _this.activeDescendantId;

        if (this.props.options.length < 1) {
            return null;
        }

        var optionsStyle = Object.assign({}, {
           display: isDropdownVisible ? 'block' : 'none',
       }, this.props.optionsStyle || {});

        return (
            React.createElement("ul", {id: _this.optionsId,
                ref: "dropdown",
                role: "listbox",
                "aria-hidden": !isDropdownVisible,
                style: optionsStyle,
                className: this.props.optionsClassName || "react-typeahead-options",
                onMouseOut: this.handleMouseOut},

                    props.options.map(function(data, index) {
                        var isSelected = selectedIndex === index;

                        return (
                            React.createElement("li", {id: isSelected ? activeDescendantId : null,
                                "aria-selected": isSelected,
                                role: "option",
                                key: index,
                                onClick: _this.handleOptionClick.bind(_this, index),
                                onMouseOver: _this.handleOptionMouseOver.bind(_this, index)},

                                React.createElement(OptionTemplate, {
                                    data: data,
                                    index: index,
                                    userInputValue: _this.userInputValue,
                                    inputValue: props.inputValue,
                                    isSelected: isSelected}
                                )
                            )
                        );
                    })

            )
        );
    },

    renderAriaMessageForOptions: function() {
        var _this = this,
            props = _this.props,
            inputValue = props.inputValue,
            option = props.options[_this.state.selectedIndex] || inputValue;

        return (
            React.createElement(AriaStatus, {
                message: props.getMessageForOption(option) || inputValue}
            )
        );
    },

    renderAriaMessageForIncomingOptions: function() {
        var props = this.props;

        return (
            React.createElement(AriaStatus, {
                message: props.getMessageForIncomingOptions(props.options.length)}
            )
        );
    },

    showDropdown: function() {
        var _this = this;

        if (!_this.state.isDropdownVisible) {
            _this.setState({
                isDropdownVisible: true
            }, function() {
                _this.props.onDropdownOpen();
            });
        }
    },

    hideDropdown: function() {
        var _this = this;

        if (_this.state.isDropdownVisible) {
            _this.setState({
                isDropdownVisible: false
            }, function() {
                _this.props.onDropdownClose();
            });
        }
    },

    showHint: function() {
        var _this = this,
            props = _this.props,
            inputValue = props.inputValue,
            inputValueLength = inputValue.length,
            isHintVisible = inputValueLength > 0 &&
                // A visible part of the hint must be
                // available for us to complete it.
                props.handleHint(inputValue, props.options).slice(inputValueLength).length > 0;

        _this.setState({
            isHintVisible: isHintVisible
        });
    },

    hideHint: function() {
        this.setState({
            isHintVisible: false
        });
    },

    setSelectedIndex: function(index, callback) {
        this.setState({
            selectedIndex: index
        }, callback);
    },

    handleChange: function(event) {
        var _this = this;

        _this.showHint();
        _this.showDropdown();
        _this.setSelectedIndex(-1);
        _this.props.onChange(event);
        _this.userInputValue = event.target.value;
    },

    focus: function() {
        var f = this.refs.input;
        if (f) {
            ReactDOM.findDOMNode(f).focus();
        }
    },

    handleFocus: function(event) {
        var _this = this;

        _this.showDropdown();
        _this.props.onFocus(event);
    },

    handleClick: function(event) {
        var _this = this;

        _this.showHint();
        _this.props.onInputClick(event);
    },

    navigate: function(direction, callback) {
        var _this = this,
            minIndex = -1,
            maxIndex = _this.props.options.length - 1,
            index = _this.state.selectedIndex + direction;

        if (index > maxIndex) {
            index = minIndex;
        } else if (index < minIndex) {
            index = maxIndex;
        }

        _this.setSelectedIndex(index, callback);
    },

    handleKeyDown: function(event) {
        var _this = this,
            key = event.key,
            props = _this.props,
            input = _this.refs.input,
            isDropdownVisible = _this.state.isDropdownVisible,
            isHintVisible = _this.state.isHintVisible,
            hasHandledKeyDown = false,
            index,
            optionData,
            dir;

        switch (key) {
        case 'End':
        case 'Tab':
            if (isHintVisible && !event.shiftKey) {
                event.preventDefault();
                props.onComplete(event, props.handleHint(props.inputValue, props.options));
            }
            break;
        case 'ArrowLeft':
        case 'ArrowRight':
            if (isHintVisible && !event.shiftKey && input.isCursorAtEnd()) {
                dir = getTextDirection(props.inputValue);

                if ((dir === 'ltr' && key === 'ArrowRight') || (dir === 'rtl' && key === 'ArrowLeft')) {
                    props.onComplete(event, props.handleHint(props.inputValue, props.options));
                }
            }
            break;
        case 'Enter':
            _this.focus();
            _this.hideHint();
            _this.hideDropdown();
            break;
        case 'Escape':
            _this.hideHint();
            _this.hideDropdown();
            break;
        case 'ArrowUp':
        case 'ArrowDown':
            if (props.options.length > 0) {
                event.preventDefault();

                _this.showHint();
                _this.showDropdown();

                if (isDropdownVisible) {
                    dir = key === 'ArrowUp' ? -1: 1;
                    hasHandledKeyDown = true;

                    _this.navigate(dir, function() {
                        var selectedIndex = _this.state.selectedIndex,
                            previousInputValue = _this.previousInputValue,
                            optionData = previousInputValue,
                            optionOffsetTop = 0,
                            selectedOption,
                            dropdown;

                        // We're currently on an option.
                        if (selectedIndex >= 0) {
                            // Save the current `input` value,
                            // as we might arrow back to it later.
                            if (previousInputValue === null) {
                                _this.previousInputValue = props.inputValue;
                            }

                            optionData = props.options[selectedIndex];
                            // Make selected option always scroll to visible
                            dropdown = ReactDOM.findDOMNode(_this.refs.dropdown);
                            selectedOption = dropdown.children[selectedIndex];
                            optionOffsetTop = selectedOption.offsetTop;
                            if(optionOffsetTop + selectedOption.clientHeight > dropdown.clientHeight ||
                                optionOffsetTop < dropdown.scrollTop) {
                                dropdown.scrollTop = optionOffsetTop;
                            }
                        }

                        props.onOptionChange(event, optionData, selectedIndex);
                    });
                }
            }
            break;
        }

        if (!hasHandledKeyDown) {
            index = this.state.selectedIndex;
            optionData = index < 0 ? props.inputValue : props.options[index];

            props.onKeyDown(event, optionData, index);
        }
    },

    handleOptionClick: function(selectedIndex, event) {
        var _this = this,
            props = _this.props;

        _this.focus();
        _this.hideHint();
        _this.hideDropdown();
        _this.setSelectedIndex(selectedIndex);
        props.onOptionClick(event, props.options[selectedIndex], selectedIndex);
    },

    handleOptionMouseOver: function(selectedIndex) {
        var _this = this;

        if (_this.props.hoverSelect) {
            _this.setSelectedIndex(selectedIndex);
        }
    },

    handleMouseOut: function() {
        var _this = this;

        if (_this.props.hoverSelect) {
            _this.setSelectedIndex(-1);
        }
    },

    handleWindowClose: function(event) {
        var _this = this,
            target = event.target;

        if (target !== window && !ReactDOM.findDOMNode(this).contains(target)) {
            _this.hideHint();
            _this.hideDropdown();
        }
    }
});

module.exports = Typeahead;
