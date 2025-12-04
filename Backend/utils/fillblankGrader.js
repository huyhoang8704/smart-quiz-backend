/**
 * Helper: Remove Vietnamese tones
 */
function removeVietnameseTones(str) {
    if (str == null) return '';
    return String(str)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

/**
 * Helper: Normalize token
 */
function normalizeToken(raw, opts = {}) {
    const { removeAccents = true, lower = true, stripParenthetical = false } = opts;
    let s = raw == null ? '' : String(raw);

    if (stripParenthetical) {
        s = s.replace(/\(.*?\)/g, ' ');
    }
    s = s.trim();
    if (lower) s = s.toLowerCase();
    if (removeAccents) s = removeVietnameseTones(s);

    s = s.replace(/[^\p{L}\p{N}_]+/gu, ' ').replace(/\s+/g, ' ').trim();
    return s;
}

/**
 * Helper: Smart split (ignores delimiters inside quotes or parentheses)
 */
function splitSmart(input, delimiter = ',') {
    if (input == null) return [];
    const s = String(input);
    if (delimiter === '') return [s];

    const dlen = delimiter.length;
    const out = [];
    let cur = '';
    let parenDepth = 0;
    let inQuote = null;

    for (let i = 0; i < s.length; ++i) {
        const ch = s[i];

        if (inQuote) {
            cur += ch;
            if (ch === inQuote) inQuote = null;
            continue;
        }
        if (ch === '"' || ch === "'") {
            inQuote = ch;
            cur += ch;
            continue;
        }
        if (ch === '(') {
            parenDepth += 1;
            cur += ch;
            continue;
        }
        if (ch === ')') {
            if (parenDepth > 0) parenDepth -= 1;
            cur += ch;
            continue;
        }

        if (parenDepth === 0 && inQuote === null) {
            if (s.substring(i, i + dlen) === delimiter) {
                out.push(cur.trim());
                cur = '';
                i += dlen - 1;
                continue;
            }
        }
        cur += ch;
    }
    if (cur.trim() !== '') out.push(cur.trim());
    return out;
}

/* -------------------------- FIXED LOGIC -------------------------- */

/**
 * parseExpectedAnswers (FIXED: Returns 1D Array)
 * * Chuyển đổi chuỗi đáp án thành mảng 1 chiều.
 * Ví dụ: "Cam, Quýt, Bưởi" -> ["Cam", "Quýt", "Bưởi"]
 */
function parseExpectedAnswers(answerString, options = {}) {
    const { delimiter = ',' } = options;

    if (answerString == null) return [];

    // Sử dụng splitSmart để tách các đáp án dựa trên delimiter
    // Kết quả trả về là mảng 1 chiều các chuỗi raw
    return splitSmart(answerString, delimiter).filter(x => x.length > 0);
}

/**
 * compareUserAnswer (FIXED: Compares 1D User Array vs 1D Expected Array)
 *
 * options:
 * {
 * unordered: true,           // true: không quan trọng thứ tự, false: phải đúng vị trí
 * removeAccents: true,
 * lower: true,
 * stripParenthetical: true,
 * delimiter: ','             // Dùng để split string input nếu input không phải là array
 * }
 */
function compareUserAnswer(userInput, expected, options = {}) {
    const opts = Object.assign({
        unordered: false, // Mặc định là true (người dùng nhập lộn xộn vẫn tính điểm)
        removeAccents: true,
        lower: true,
        stripParenthetical: true,
        delimiter: ','
    }, options);

    // 1. Chuẩn bị mảng Expected (Raw) - Mảng 1 chiều
    let expectedArrRaw;
    if (Array.isArray(expected)) {
        expectedArrRaw = expected.map(x => String(x));
    } else {
        expectedArrRaw = parseExpectedAnswers(expected, { delimiter: opts.delimiter });
    }

    // 2. Chuẩn bị mảng User Input (Raw) - Mảng 1 chiều
    let studentArrRaw;
    if (Array.isArray(userInput)) {
        studentArrRaw = userInput.map(x => x == null ? '' : String(x));
    } else {
        // Tự động split chuỗi input của user
        studentArrRaw = splitSmart(userInput, opts.delimiter);
    }

    // 3. Chuẩn hóa token để so sánh (Normalize)
    const normOpts = {
        removeAccents: opts.removeAccents,
        lower: opts.lower,
        stripParenthetical: opts.stripParenthetical
    };

    const expectedNorm = expectedArrRaw.map(v => normalizeToken(v, normOpts));
    const studentNorm = studentArrRaw.map(v => normalizeToken(v, normOpts));

    // 4. Logic so sánh (Matching)
    const perBlank = [];
    const usedExpectedIndices = new Set(); // Để đảm bảo 1 đáp án đúng không bị tính 2 lần cho 2 input khác nhau

    // Số lượng câu hỏi/đáp án cần check
    // Nếu check theo thứ tự, ta duyệt theo max length
    // Nếu check không thứ tự, ta duyệt qua tất cả câu trả lời của user
    const loopLen = opts.unordered ? studentNorm.length : Math.max(expectedNorm.length, studentNorm.length);

    for (let i = 0; i < loopLen; i++) {
        const sRaw = i < studentArrRaw.length ? studentArrRaw[i] : '';
        const sNorm = i < studentNorm.length ? studentNorm[i] : '';

        let matched = false;
        let matchedIndex = null;
        let matchedExpectedRaw = null;

        if (opts.unordered) {
            // --- Logic không quan trọng thứ tự ---
            // Tìm trong mảng expected xem có cái nào khớp với sNorm và chưa được dùng không
            for (let j = 0; j < expectedNorm.length; j++) {
                if (!usedExpectedIndices.has(j)) {
                    if (expectedNorm[j] === sNorm && sNorm !== '') {
                        matched = true;
                        matchedIndex = j;
                        matchedExpectedRaw = expectedArrRaw[j];
                        usedExpectedIndices.add(j); // Đánh dấu đã dùng đáp án này
                        break;
                    }
                }
            }

            perBlank.push({
                studentRaw: sRaw,
                studentNorm: sNorm,
                matched: matched,
                matchedWithIndex: matchedIndex,
                matchedExpectation: matchedExpectedRaw
            });

        } else {
            // --- Logic quan trọng thứ tự (Index khớp Index) ---
            const eRaw = i < expectedArrRaw.length ? expectedArrRaw[i] : null;
            const eNorm = i < expectedNorm.length ? expectedNorm[i] : null;

            if (eNorm !== null && sNorm === eNorm && sNorm !== '') {
                matched = true;
                matchedIndex = i;
                matchedExpectedRaw = eRaw;
            }

            perBlank.push({
                index: i,
                studentRaw: sRaw,
                studentNorm: sNorm,
                expectedRaw: eRaw || '', // Hiển thị để debug
                matched: matched
            });
        }
    }

    // 5. Tính điểm
    // Nếu unordered: Tìm xem còn bao nhiêu expected chưa được match để báo thiếu
    if (opts.unordered) {
        expectedArrRaw.forEach((eRaw, idx) => {
            if (!usedExpectedIndices.has(idx)) {
                // Thêm vào report những đáp án người dùng còn thiếu
                perBlank.push({
                    studentRaw: null, // User không nhập
                    studentNorm: null,
                    matched: false,
                    missingIndex: idx,
                    missingExpectation: eRaw
                });
            }
        });
    }

    const totalCorrect = perBlank.filter(p => p.matched).length;
    const totalExpected = Math.max(1, expectedArrRaw.length);
    const score = totalCorrect / totalExpected;

    return {
        perBlank,
        totalCorrect,
        totalExpected,
        score
    };
}

module.exports = {
    removeVietnameseTones,
    normalizeToken,
    splitSmart,
    parseExpectedAnswers,
    compareUserAnswer
};
