'use strict';
'require view';
'require form';
'require uci';
'require rpc';
'require ui';
'require fs';

var callListCommands = rpc.declare({
	object: 'luci.quick_action',
	method: 'list_commands',
	expect: { commands: [] }
});

var callRunCommand = rpc.declare({
	object: 'luci.quick_action',
	method: 'run_command',
	params: ['id'],
	expect: { success: false }
});

var callAddCommand = rpc.declare({
	object: 'luci.quick_action',
	method: 'add_command',
	params: ['name', 'description', 'type', 'exec', 'ubus_object', 'ubus_method', 'ubus_params'],
	expect: { success: false }
});

var callDeleteCommand = rpc.declare({
	object: 'luci.quick_action',
	method: 'delete_command',
	params: ['id'],
	expect: { success: false }
});

var callListTokens = rpc.declare({
	object: 'luci.quick_action',
	method: 'list_tokens',
	expect: { tokens: [] }
});

var callAddToken = rpc.declare({
	object: 'luci.quick_action',
	method: 'add_token',
	params: ['name', 'token', 'expires'],
	expect: { success: false }
});

var callDeleteToken = rpc.declare({
	object: 'luci.quick_action',
	method: 'delete_token',
	params: ['id'],
	expect: { success: false }
});

function generateToken() {
	var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var token = '';
	for (var i = 0; i < 32; i++) {
		token += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return token;
}

return view.extend({
	load: function () {
		return Promise.all([
			callListCommands(),
			callListTokens(),
			uci.load('quick_action')
		]);
	},

	render: function (data) {
		var commands = data[0] || [];
		var tokens = data[1] || [];

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
		s = m.section(form.GridSection, 'command', _('Quick Commands'),
			_('Define commands that can be executed via HTTP API. Supports shell commands and ubus calls.'));
		s.addremove = true;
		s.anonymous = true;
		s.sortable = true;
		s.nodescriptions = true;

		o = s.option(form.Value, 'name', _('Name'));
		o.rmempty = false;
		o.placeholder = 'restart_wan';

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

		o = s.option(form.Button, '_run', _('Run'));
		o.inputtitle = _('Execute');
		o.inputstyle = 'apply';
		o.onclick = function (ev, section_id) {
			var name = uci.get('quick_action', section_id, 'name');
			var type = uci.get('quick_action', section_id, 'type') || 'shell';
			return ui.showModal(_('Execute Command'), [
				E('p', _('Are you sure you want to execute "%s" (%s)?').format(name, type)),
				E('div', { 'class': 'right' }, [
					E('button', {
						'class': 'btn',
						'click': ui.hideModal
					}, _('Cancel')),
					' ',
					E('button', {
						'class': 'btn cbi-button-action important',
						'click': function () {
							ui.hideModal();
							ui.showModal(_('Executing...'), [
								E('p', { 'class': 'spinning' }, _('Please wait...'))
							]);
							return callRunCommand(section_id).then(function (result) {
								ui.hideModal();
								if (result.success) {
									ui.addNotification(null, E('p', _('Command executed successfully.')), 'info');
									if (result.output) {
										ui.showModal(_('Command Output'), [
											E('pre', { 'style': 'white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow: auto;' }, result.output),
											E('div', { 'class': 'right' }, [
												E('button', {
													'class': 'btn',
													'click': ui.hideModal
												}, _('Close'))
											])
										]);
									}
								} else {
									ui.addNotification(null, E('p', _('Command failed: %s').format(result.error || 'Unknown error')), 'error');
								}
							}).catch(function (err) {
								ui.hideModal();
								ui.addNotification(null, E('p', _('Error: %s').format(err.message)), 'error');
							});
						}
					}, _('Execute'))
				])
			]);
		};

		// Tokens section
		s = m.section(form.GridSection, 'token', _('API Tokens'),
			_('Manage tokens for HTTP API authentication. Tokens can be passed via URL parameter (?token=xxx) or Header (X-Quick-Action-Token).'));
		s.addremove = true;
		s.anonymous = true;
		s.sortable = true;
		s.nodescriptions = true;

		o = s.option(form.Value, 'name', _('Name'));
		o.rmempty = false;
		o.placeholder = 'my_token';

		o = s.option(form.Value, 'token', _('Token'));
		o.rmempty = false;
		o.password = true;
		o.placeholder = _('Auto-generate or enter manually');
		o.cfgvalue = function (section_id) {
			return uci.get('quick_action', section_id, 'token') || '';
		};

		// Add generate button next to token field
		o = s.option(form.Button, '_generate', _('Generate'));
		o.inputtitle = _('Generate');
		o.inputstyle = 'apply';
		o.onclick = function (ev, section_id) {
			var newToken = generateToken();
			var tokenInput = document.querySelector('input[data-name="token"][data-section="%s"]'.format(section_id));
			if (tokenInput) {
				tokenInput.value = newToken;
				tokenInput.dispatchEvent(new Event('change'));
			} else {
				// Fallback: set via UCI
				uci.set('quick_action', section_id, 'token', newToken);
				ui.addNotification(null, E('p', _('Token generated: %s. Please save the configuration.').format(newToken)), 'info');
			}
		};

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.rmempty = false;
		o.default = '1';

		o = s.option(form.Value, 'expires', _('Expires (Unix timestamp)'));
		o.placeholder = '0';
		o.default = '0';
		o.datatype = 'uinteger';
		o.description = _('0 = never expires');

		// API Usage Info
		s = m.section(form.NamedSection, 'global', 'quick_action', _('API Usage'));

		o = s.option(form.DummyValue, '_api_info');
		o.rawhtml = true;
		o.cfgvalue = function () {
			var host = window.location.hostname;
			return E('div', { 'class': 'cbi-value-description' }, [
				E('h4', _('HTTP API Endpoints')),
				E('p', [
					E('strong', _('List Commands: ')),
					E('code', 'GET /cgi-bin/quick_action?action=list&token=YOUR_TOKEN')
				]),
				E('p', [
					E('strong', _('Run Command: ')),
					E('code', 'GET /cgi-bin/quick_action?action=run&cmd=COMMAND_ID&token=YOUR_TOKEN')
				]),
				E('h4', _('Header Authentication')),
				E('p', [
					E('code', 'X-Quick-Action-Token: YOUR_TOKEN')
				]),
				E('h4', _('Example (curl)')),
				E('pre', { 'style': 'background: #f5f5f5; padding: 10px; border-radius: 4px;' }, [
					'# List commands\n',
					'curl "http://' + host + '/cgi-bin/quick_action?action=list&token=YOUR_TOKEN"\n\n',
					'# Run shell command\n',
					'curl "http://' + host + '/cgi-bin/quick_action?action=run&cmd=example_restart_wan&token=YOUR_TOKEN"\n\n',
					'# Run ubus command\n',
					'curl "http://' + host + '/cgi-bin/quick_action?action=run&cmd=example_ubus_network&token=YOUR_TOKEN"\n\n',
					'# With header\n',
					'curl -H "X-Quick-Action-Token: YOUR_TOKEN" "http://' + host + '/cgi-bin/quick_action?action=list"'
				])
			]);
		};

		return m.render();
	}
});
