// @ts-check

// import util from 'node:util';
// import { describe, it, todo } from 'node:test';
import assert from 'node:assert/strict';
import { unescapeIrc, escapeIrc, parseTagsFromString, parse, parsePrefix, format } from './irc';

// util.inspect.defaultOptions.depth = null;

const regexKebabToCamel = /-(\w)/g;

/**
 * @param {string} str
 */
function kebabToCamel(str: string) {
    return str.replace(regexKebabToCamel, (_, match) => match.toUpperCase());
}

describe('unescaping irc tag', () => {
    it('does not alter empty strings', () => {
        assert.equal(unescapeIrc(''), '');
    });
    it('does not alter plain alphanumeric/space', () => {
        assert.equal(unescapeIrc('snakes and ladders'), 'snakes and ladders');
    });
    it('replaces known escape sequences', () => {
        assert.equal(unescapeIrc('\\s'), ' ', 'spaces');
        assert.equal(unescapeIrc('\\n'), '\n', 'new lines');
        assert.equal(unescapeIrc('\\r'), '\r', 'carriage returns');
        assert.equal(unescapeIrc('\\:'), ';', 'semicolons');
        assert.equal(unescapeIrc('\\\\'), '\\', 'backslashes');
    });
});

describe('escaping irc tag', () => {
    it('does not alter empty strings', () => {
        assert.equal(escapeIrc(''), '');
    });
    it('replaces multiple known characters', () => {
        assert.equal(escapeIrc('snakes and ladders'), 'snakes\\sand\\sladders');
    });
    it('replaces known characters', () => {
        assert.equal(escapeIrc(' '), '\\s', 'spaces');
        assert.equal(escapeIrc('\n'), '\\n', 'new lines');
        assert.equal(escapeIrc('\r'), '\\r', 'carriage returns');
        assert.equal(escapeIrc(';'), '\\:', 'semicolons');
        assert.equal(escapeIrc('\\'), '\\\\', 'backslashes');
    });
    it('stringifies numbers', () => {
        assert.equal(escapeIrc(1), '1', 'numbers');
    });
});

describe('parsing irc tags', () => {
    it('empty string is empty', () => {
        assert.deepStrictEqual(
            parseTagsFromString(''),
            { rawTags: {}, tags: {} }
        );
    });
    it('single tag', () => {
        assert.deepStrictEqual(
            parseTagsFromString('a=b'),
            { rawTags: { a: 'b' }, tags: { a: 'b' } }
        );
    });
    it('multiple tags', () => {
        assert.deepStrictEqual(
            parseTagsFromString('a=b;c=d'),
            { rawTags: { a: 'b', c: 'd' }, tags: { a: 'b', c: 'd' } }
        );
    });
    it('preserve tag key', () => {
        assert.deepStrictEqual(
            parseTagsFromString('a-b=c'),
            { rawTags: { 'a-b': 'c' }, tags: { 'a-b': 'c' } }
        );
    });
    it('using a transformation callback', () => {
        assert.deepStrictEqual(
            parseTagsFromString('a-b=0', [], (k: any, v: any, p: any) => [kebabToCamel(k), parseInt(v)]),
            { rawTags: { 'a-b': '0' }, tags: { aB: 0 } }
        );
    });
});

describe('parsing irc prefix', () => {
    it('empty string is all undefined', () => {
        assert.deepStrictEqual(parsePrefix(''), {});
    });
    it('parses host only', () => {
        assert.deepStrictEqual(parsePrefix('host'), { host: 'host' });
    });
    it('parses user and host', () => {
        assert.deepStrictEqual(parsePrefix('user@host'), { user: 'user', host: 'host' });
    });
    it('parses nick and user', () => {
        assert.deepStrictEqual(parsePrefix('nick!user'), { host: undefined, nick: 'nick', user: 'user' });
    });
    it('parses full', () => {
        assert.deepStrictEqual(parsePrefix('nick!user@host'), { nick: 'nick', user: 'user', host: 'host' });
    });
});

describe('parsing messages', () => {
    it('Parse Twitch IRC', () => {

        const msg = `@badge-info=;badges=moderator/1,subscriber/12,sub-gifter/1;color=#00FF7F;
display-name=viewer32;emotes=;id=cc106a89-1814-919d-454c-f4f2f970aae7;
mod=1;room-id=1971641;subscriber=1;turbo=0;user-id=4145994;
user-type=mod :viewer32!viewer32@viewer32.tmi.twitch.tv PRIVMSG #streamer :!sr https://youtu.be/example`;
        assert.deepStrictEqual(parse(msg), {
            channel: '#streamer',
            command: 'PRIVMSG',
            params: [
                '!sr https://youtu.be/example'
            ],
            prefix: {
                host: 'viewer32.tmi.twitch.tv',
                nick: 'viewer32',
                user: 'viewer32'
            },
            raw: '@badge-info=;badges=moderator/1,subscriber/12,sub-gifter/1;color=#00FF7F;\n' + 'display-name=viewer32;emotes=;id=cc106a89-1814-919d-454c-f4f2f970aae7;\n' + 'mod=1;room-id=1971641;subscriber=1;turbo=0;user-id=4145994;\n' + 'user-type=mod :viewer32!viewer32@viewer32.tmi.twitch.tv PRIVMSG #streamer :!sr https://youtu.be/example',
            rawTags: {
                '\ndisplay-name': 'viewer32',
                '\nmod': '1',
                '\nuser-type': 'mod',
                'badge-info': '',
                'room-id': '1971641',
                'user-id': '4145994',
                badges: 'moderator/1,subscriber/12,sub-gifter/1',
                color: '#00FF7F',
                emotes: '',
                id: 'cc106a89-1814-919d-454c-f4f2f970aae7',
                subscriber: '1',
                turbo: '0'
            },
            tags: {
                '\ndisplay-name': 'viewer32',
                '\nmod': '1',
                '\nuser-type': 'mod',
                'badge-info': '',
                'room-id': '1971641',
                'user-id': '4145994',
                badges: 'moderator/1,subscriber/12,sub-gifter/1',
                color: '#00FF7F',
                emotes: '',
                id: 'cc106a89-1814-919d-454c-f4f2f970aae7',
                subscriber: '1',
                turbo: '0'
            }
        });
    });

    it('empty string is empty', () => {
        assert.deepStrictEqual(parse(''), {
            raw: '', prefix: {}, command: '', channel: '', params: [], rawTags: {}, tags: {}
        });
    });
    // it('basic messages', async (t:) => {
    //     /** @type {{ message: string; expected: import('@tmi.js/irc-parser').IrcMessage; }[]} */
    //     const tests = [
    //         {
    //             message: 'PING message',
    //             expected: {
    //                 channel: '',
    //                 command: 'PING',
    //                 params: [],
    //                 prefix: {},
    //                 raw: 'PING',
    //                 rawTags: {},
    //                 tags: {},
    //             }
    //         },
    //         {
    //             message: 'PING message with originator parameter',
    //             expected: {
    //                 channel: '',
    //                 command: 'PING',
    //                 params: ['tmi.twitch.tv'],
    //                 prefix: {},
    //                 raw: 'PING :tmi.twitch.tv',
    //                 rawTags: {},
    //                 tags: {},
    //             }
    //         },
    //     ];
    //     for (let i = 0; i < tests.length; i++) {
    //         const { message, expected } = tests[i];
    //         await t.test(message, () => {
    //             assert.deepStrictEqual(parse(expected.raw), expected);
    //         });
    //     }
    // });
    // it('messages with tags', t => {
    //     /** @type {{ message: string; tagParser?: import('@tmi.js/irc-parser').ParseTagCallbackFn; expected: import('@tmi.js/irc-parser').IrcMessage; }[]} */
    //     const tests = [
    //         {
    //             message: 'PRIVMSG message with tag parser',
    //             tagParser: (key: string, value: string) => {
    //                 key = kebabToCamel(key);
    //                 switch (key) {
    //                     case 'tmiSentTs':
    //                         {
    //                             return [key, parseInt(value, 10)];
    //                         }
    //                     case 'firstMsg':
    //                     case 'mod':
    //                     case 'returningChatter':
    //                     case 'subscriber':
    //                     case 'turbo':
    //                         {
    //                             return [key, value === '1'];
    //                         }
    //                 }
    //                 return [key, value];
    //             },
    //             expected: {
    //                 raw: "@badge-info=;badges=;client-nonce=nonce;color=#FF4500;display-name=Name_1;emotes=;first-msg=0;flags=;id=uuid_3;mod=0;reply-parent-display-name=Name_2;reply-parent-msg-body=@Name_1\\shey,\\swhat's\\sgoing\\son?;reply-parent-msg-id=uuid_1;reply-parent-user-id=11111;reply-parent-user-login=name_1;reply-thread-parent-display-name=Name_1;reply-thread-parent-msg-id=uuid_2;reply-thread-parent-user-id=22222;reply-thread-parent-user-login=name_2;returning-chatter=0;room-id=33333;subscriber=0;tmi-sent-ts=1700000000000;turbo=0;user-id=22222;user-type= :name_2!name_2@name_2.tmi.twitch.tv PRIVMSG #channel :@Name_2 not much",
    //                 rawTags: {
    //                     'badge-info': '',
    //                     badges: '',
    //                     'client-nonce': 'nonce',
    //                     color: '#FF4500',
    //                     'display-name': 'Name_1',
    //                     emotes: '',
    //                     'first-msg': '0',
    //                     flags: '',
    //                     id: 'uuid_3',
    //                     mod: '0',
    //                     'reply-parent-display-name': 'Name_2',
    //                     'reply-parent-msg-body': "@Name_1 hey, what's going on?",
    //                     'reply-parent-msg-id': 'uuid_1',
    //                     'reply-parent-user-id': '11111',
    //                     'reply-parent-user-login': 'name_1',
    //                     'reply-thread-parent-display-name': 'Name_1',
    //                     'reply-thread-parent-msg-id': 'uuid_2',
    //                     'reply-thread-parent-user-id': '22222',
    //                     'reply-thread-parent-user-login': 'name_2',
    //                     'returning-chatter': '0',
    //                     'room-id': '33333',
    //                     subscriber: '0',
    //                     'tmi-sent-ts': '1700000000000',
    //                     turbo: '0',
    //                     'user-id': '22222',
    //                     'user-type': ''
    //                 },
    //                 tags: {
    //                     badgeInfo: '',
    //                     badges: '',
    //                     clientNonce: 'nonce',
    //                     color: '#FF4500',
    //                     displayName: 'Name_1',
    //                     emotes: '',
    //                     firstMsg: false,
    //                     flags: '',
    //                     id: 'uuid_3',
    //                     mod: false,
    //                     replyParentDisplayName: 'Name_2',
    //                     replyParentMsgBody: "@Name_1 hey, what's going on?",
    //                     replyParentMsgId: 'uuid_1',
    //                     replyParentUserId: '11111',
    //                     replyParentUserLogin: 'name_1',
    //                     replyThreadParentDisplayName: 'Name_1',
    //                     replyThreadParentMsgId: 'uuid_2',
    //                     replyThreadParentUserId: '22222',
    //                     replyThreadParentUserLogin: 'name_2',
    //                     returningChatter: false,
    //                     roomId: '33333',
    //                     subscriber: false,
    //                     tmiSentTs: 1700000000000,
    //                     turbo: false,
    //                     userId: '22222',
    //                     userType: ''
    //                 },
    //                 prefix: {
    //                     nick: 'name_2',
    //                     user: 'name_2',
    //                     host: 'name_2.tmi.twitch.tv'
    //                 },
    //                 command: 'PRIVMSG',
    //                 channel: '#channel',
    //                 params: ['@Name_2 not much']
    //             }
    //         },
    //     ];
    //     for (let i = 0; i < tests.length; i++) {
    //         const { message, tagParser, expected } = tests[i];
    //         assert.deepStrictEqual(parse(expected.raw, tagParser as any), expected, message);
    //     }
    // });
});

describe('formatting messages', () => {
    it('basic messages', () => {
        assert.equal(format({
            command: 'PING',
        }), 'PING');
        assert.equal(format({
            command: 'PING',
            prefix: { nick: undefined, user: undefined, host: 'tmi.twitch.tv' },
        }), 'PING');
    });
    it('messages with tags', () => {
        const example = "@badge-info=;badges=;client-nonce=nonce;color=#FF4500;display-name=Name_1;emotes=;first-msg=0;flags=;id=uuid_3;mod=0;reply-parent-display-name=Name_2;reply-parent-msg-body=@Name_1\\shey,\\swhat's\\sgoing\\son?;reply-parent-msg-id=uuid_1;reply-parent-user-id=11111;reply-parent-user-login=name_1;reply-thread-parent-display-name=Name_1;reply-thread-parent-msg-id=uuid_2;reply-thread-parent-user-id=22222;reply-thread-parent-user-login=name_2;returning-chatter=0;room-id=33333;subscriber=0;tmi-sent-ts=1700000000000;turbo=0;user-id=22222;user-type= :name_2!name_2@name_2.tmi.twitch.tv PRIVMSG #channel :@Name_2 not much";
        assert.equal(format(parse(example)), example);
    });
});