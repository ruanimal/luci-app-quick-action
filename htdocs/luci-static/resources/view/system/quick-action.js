'use strict';
'require view';
'require form';
'require uci';
'require ui';

function generateToken() {
	var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var token = '';
	for (var i = 0; i < 32; i++) {
		token += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return token;
}

function getApiUsageHtml() {
	var host = window.location.hostname;
	return [
		'<h4>HTTP API Endpoints</h4>',
		'<p><strong>List Commands: </strong><code>GET /cgi-bin/quick_action?action=list&amp;token=YOUR_TOKEN</code></p>',
		'<p><strong>Run Command: </strong><code>GET /cgi-bin/quick_action?action=run&amp;cmd=COMMAND_NAME&amp;token=YOUR_TOKEN</code></p>',
		'<h4>Header Authentication</h4>',
		'<p><code>X-Quick-Action-Token: YOUR_TOKEN</code></p>',
		'<h4>Example (curl)</h4>',
		'<pre style="background:#f5f5f5;padding:10px;border-radius:4px">',
		'# List commands',
		'curl "http://' + host + '/cgi-bin/quick_action?action=list&token=YOUR_TOKEN"',
		'',
		'# Run command',
		'curl "http://' + host + '/cgi-bin/quick_action?action=run&cmd=restart_wan&token=YOUR_TOKEN"',
		'',
		'# With header',
		'curl -H "X-Quick-Action-Token: YOUR_TOKEN" "http://' + host + '/cgi-bin/quick_action?action=list"',
		'</pre>'
	].join('\n');
}

return view.extend({
	load: function () {
		return uci.load('quick_action');
	},

	render: function () {
		var m, s, o;

		m = new form.Map('quick_action', _('Quick Action'),
			_('Configure quick action commands and manage access tokens for HTTP API.'));

		// Global settings
		s = m.section(form.TypedSection, 'quick_action', _('Global Settings'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable Quick Action'));
		o.rmempty = false;
		o.default = '1';

		// Commands section
		s = m.section(form.GridSection, 'command', _('Commands'),
			_('Define commands that can be executed via HTTP API. Supports shell commands and ubus calls.'));
		s.addremove = true;
		s.anonymous = true;
		s.sortable = true;
		s.nodescriptions = true;

		o = s.option(form.Value, 'name', _('Name'));
		o.rmempty = false;
		o.placeholder = 'restart_wan';
		o.datatype = 'uciname';
		o.validate = function (section_id, value) {
			if (!value || value.length === 0)
				return _('Name is required');
			if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value))
				return _('Name must start with a letter or underscore, and contain only letters, numbers, and underscores');
			return true;
		};

		o = s.option(form.Value, 'description', _('Description'));
		o.placeholder = _('Restart WAN interface');

		o = s.option(form.ListValue, 'type', _('Type'));
		o.value('shell', _('Shell Command'));
		o.value('ubus', _('ubus Call'));
		o.default = 'shell';
		o.rmempty = false;

		o = s.option(form.Value, 'exec', _('Shell Command'));
		o.placeholder = '/sbin/ifdown wan && /sbin/ifup wan';
		o.depends('type', 'shell');
		o.rmempty = true;

		o = s.option(form.Value, 'ubus_object', _('ubus Object'));
		o.placeholder = 'network.interface.wan';
		o.depends('type', 'ubus');
		o.rmempty = true;

		o = s.option(form.Value, 'ubus_method', _('ubus Method'));
		o.placeholder = 'status';
		o.depends('type', 'ubus');
		o.rmempty = true;

		o = s.option(form.Value, 'ubus_params', _('ubus Params (JSON)'));
		o.placeholder = '{"key": "value"}';
		o.depends('type', 'ubus');
		o.rmempty = true;

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.rmempty = false;
		o.default = '1';

		// Tokens section
		s = m.section(form.GridSection, 'token', _('API Tokens'),
			_('Manage tokens for HTTP API authentication. Tokens can be passed via URL parameter (?token=xxx) or Header (X-Quick-Action-Token).'));
		s.addremove = true;
		s.anonymous = true;
		s.sortable = true;
		s.nodescriptions = true;

		o = s.option(form.Value, 'token', _('Token'));
		o.rmempty = false;
		o.password = true;
		o.placeholder = _('Auto-generate or enter manually');
		o.validate = function (section_id, value) {
			if (!value || value.length === 0)
				return _('Token is required');
			if (value.length < 8)
				return _('Token must be at least 8 characters');
			if (!/^[a-zA-Z0-9_-]+$/.test(value))
				return _('Token can only contain letters, numbers, underscores and hyphens');
			return true;
		};
		o.cfgvalue = function (section_id) {
			return uci.get('quick_action', section_id, 'token') || '';
		};

		// Add generate button next to token field
		o = s.option(form.Button, '_generate', _('Generate'));
		o.inputtitle = _('Generate');
		o.inputstyle = 'apply';
		o.onclick = function (ev, section_id) {
			var newToken = generateToken();

			// 使用 LuCI 标准 input ID 格式定位 token 输入框
			// ID 格式: widget.cbid.quick_action.{section_id}.token
			var inputId = 'widget.cbid.quick_action.' + section_id + '.token';
			var tokenInput = document.getElementById(inputId);

			if (tokenInput) {
				tokenInput.value = newToken;
				tokenInput.type = 'text'; // 临时显示为明文方便查看
				tokenInput.dispatchEvent(new Event('change', { bubbles: true }));
				tokenInput.classList.remove('cbi-input-invalid');

				// 选中文本方便复制
				tokenInput.select();

				// 3秒后恢复为密码类型
				setTimeout(function () {
					tokenInput.type = 'password';
				}, 3000);

				ui.addNotification(null, E('p', _('Token generated and filled. Please save the configuration.')), 'info');
			} else {
				// 备用方案：直接设置 UCI 并提示
				uci.set('quick_action', section_id, 'token', newToken);
				ui.addNotification(null, E('p', _('Token generated: %s').format(newToken)), 'info');
			}
		};

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.rmempty = false;
		o.default = '1';

		o = s.option(form.Value, 'remark', _('Remark'));
		o.placeholder = _('Optional description');
		o.rmempty = true;

		o = s.option(form.Value, 'expires', _('Expires (Unix timestamp)'));
		o.placeholder = '0';
		o.default = '0';
		o.datatype = 'uinteger';
		o.description = _('0 = never expires');

		// API Usage Info
		s = m.section(form.NamedSection, 'global', 'quick_action', _('API Usage'));

		o = s.option(form.DummyValue, '_api_info');
		o.rawhtml = true;
		o.cfgvalue = getApiUsageHtml;

		return m.render();
	}
});
