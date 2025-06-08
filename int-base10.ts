/**
 * TypeScript Generic 10進整数演算ライブラリ
 * 
 * TypeScriptの型システムを使用して、コンパイル時に任意精度の10進整数演算を行うライブラリです。
 * 
 * ## 内部表現
 * 整数は `{p: DIGIT[], n: DIGIT[]}` の形式で表現されます：
 * - 正の数: `p` に数字配列、`n` は空配列
 * - 負の数: `n` に数字配列、`p` は空配列  
 * - ゼロ: `p`, `n` ともに空配列
 * 
 * 各数字配列はビッグエンディアン形式で、先頭要素は非ゼロです。
 * 
 * @example
 * ```typescript
 * // 10 を表現: {p: [1, 0], n: []}
 * type Ten = IntBase10<10>
 * 
 * // -32 を表現: {p: [], n: [3, 2]}
 * type MinusThirtyTwo = IntBase10<-32>
 * 
 * // 0 を表現: {p: [], n: []}
 * type Zero = IntBase10<0>
 * 
 * // 基本的な演算
 * type Sum = Add<123, 456>        // 579
 * type Product = Mul<"999", 2>    // "1998"
 * type Quotient = Div<100, 3>     // 33
 * ```
 */

// ============================================================================
// 基本型定義
// ============================================================================

/**
 * 0-9の数字を表す型
 */
type DIGIT = | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/**
 * 1-9の非ゼロ数字を表す型
 */
type NZDIGIT = | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/**
 * 正規化された正の数字列（先頭が非ゼロ）
 */
type POS_DIGITS = [NZDIGIT, ...DIGIT[]]

/**
 * 正規化された数字列（空配列または正の数字列）
 */
type NORM_DIGITS = POS_DIGITS | []

/**
 * 正の整数を表すIntBase10型
 */
type PosIntBase10Type = {
  p: POS_DIGITS
  n: []
}

/**
 * 負の整数を表すIntBase10型
 */
type NegIntBase10Type = {
  p: []
  n: POS_DIGITS
}

/**
 * ゼロを表すIntBase10型
 */
type IntBase10Zero = {p: [], n: []}

/**
 * IntBase10の内部表現型
 */
export type IntBase10Type = PosIntBase10Type | NegIntBase10Type | IntBase10Zero

/**
 * 1を表すIntBase10型
 */
type IntBase10One = {p: [1], n: []}

/**
 * 整数として扱える型の共用体
 */
type IntLike = number | bigint | string | IntBase10Type

// ============================================================================
// 内部ユーティリティ - 正規化・変換
// ============================================================================

/**
 * 先頭の0を除去して数字配列を正規化する
 * @internal
 */
type __Nrm<A extends DIGIT[]> =
  A extends [0, ...infer L extends DIGIT[]] ? __Nrm<L>
  : A extends NORM_DIGITS ? A : never

/**
 * 文字列を数字配列にパースする
 * @internal
 */
type __ParseDigits<S extends string> =
  S extends `${infer N extends DIGIT}${infer Rest}` ? [N, ...__ParseDigits<Rest>] : []

/**
 * 数字配列を文字列にシリアライズする
 * @internal
 */
type __SerializeDigits<A extends DIGIT[]> =
  A extends [infer First extends DIGIT, ...infer Rest extends DIGIT[]] ? `${First}${__SerializeDigits<Rest>}` : ''

/**
 * IntLikeをIntBase10Typeに変換する内部実装
 * @internal
 */
type _I<X extends IntLike> =
  X extends IntBase10Type ?  X
  : X extends number | bigint ?  _I<`${X}`>
  : X extends `${infer PM extends '+' | '-'}${infer Digits}` ?
    PM extends '-' ?  {p: [], n: __Nrm<__ParseDigits<Digits>>} : {p: __Nrm<__ParseDigits<Digits>>, n: []}
  : X extends `${number}` ?  {p: __Nrm<__ParseDigits<X>>, n: []}
  : never

/**
 * IntBase10TypeをTと同じ型で出力する内部実装
 * @internal
 */
type _O<X extends IntBase10Type, T extends IntLike> =
  T extends IntBase10Type ? X
  : T extends number ? _ToN<X>
  : T extends bigint ? _ToBI<X>
  : T extends string ? _ToS<X>
  : never

/**
 * IntBase10Typeを文字列に変換する内部実装
 * @internal
 */
type _ToS<X extends IntBase10Type> =
  X extends NegIntBase10Type ? `${'-'}${__SerializeDigits<X['n']>}`
  : X extends PosIntBase10Type ? __SerializeDigits<X['p']>
  : '0'

/**
 * IntBase10Typeを数値に変換する内部実装
 * @internal
 */
type _ToN<X extends IntBase10Type> =
  _ToS<X> extends `${infer N extends number}` ? N : never

/**
 * IntBase10Typeをbigintに変換する内部実装
 * @internal
 */
type _ToBI<X extends IntBase10Type> =
  _ToS<X> extends `${infer N extends bigint}` ? N : never

// ============================================================================
// 内部ユーティリティ - 比較演算
// ============================================================================

/**
 * 正規化された数字配列の等価性を判定
 * @internal
 */
type __Eq<A extends NORM_DIGITS, B extends NORM_DIGITS> = [A] extends [B] ? true : false

/**
 * 大小比較用のマッピングテーブル
 * @internal
 */
type __GT_MAP = [never, 0, 0|1, 0|1|2, 0|1|2|3, 0|1|2|3|4, 0|1|2|3|4|5, 0|1|2|3|4|5|6, 0|1|2|3|4|5|6|7, 0|1|2|3|4|5|6|7|8]

/**
 * 同じ長さの数字配列の大小比較（再帰実装）
 * @internal
 */
type __Gt_rec<X extends DIGIT[], Y extends DIGIT[]> =
  X extends [infer X1 extends DIGIT, ...infer Xr extends DIGIT[]] ?
    Y extends [infer Y1 extends DIGIT, ...infer Yr extends DIGIT[]] ?
      Y1 extends __GT_MAP[X1] ? true :
      X1 extends __GT_MAP[Y1] ? false :
      __Gt_rec<Xr, Yr>
    : false
  : false

/**
 * 正規化された数字配列の大小比較
 * @internal
 */
type __Gt<X extends NORM_DIGITS, Y extends NORM_DIGITS> =
  keyof X extends keyof Y ?
    keyof Y extends keyof X ?
      __Gt_rec<X, Y>
    : false
  : true

/**
 * 正規化された数字配列の以上比較
 * @internal
 */
type __Gte<X extends NORM_DIGITS, Y extends NORM_DIGITS> =
  __Eq<X, Y> extends true ? true : __Gt<X, Y>

// ============================================================================
// 内部ユーティリティ - 基本算術演算
// ============================================================================

/**
 * 数字のインクリメント用マッピング
 * @internal
 */
type __Inc_d<D extends DIGIT> = [1,2,3,4,5,6,7,8,9,0][D]

/**
 * 数字のデクリメント用マッピング
 * @internal
 */
type __Dec_d<D extends DIGIT> = [9,0,1,2,3,4,5,6,7,8][D]

/**
 * 正規化された数字配列のインクリメント
 * @internal
 */
type __Inc<A extends NORM_DIGITS> =
  A extends [...infer H extends NORM_DIGITS, infer L extends DIGIT] ? __Nrm<[...(L extends 9 ? __Inc<H> : H), __Inc_d<L>]> : [1]

/**
 * 正規化された数字配列のデクリメント
 * @internal
 */
type __Dec<A extends NORM_DIGITS> =
  A extends [...infer H extends NORM_DIGITS, infer L extends DIGIT] ? __Nrm<[...(L extends 0 ? __Dec<H> : H), __Dec_d<L>]> : []

/**
 * 加算用のルックアップテーブル
 * @internal
 */
type __PLUS_MAP = [
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9]],
  [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [1, 0]],
  [[0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [1, 0], [1, 1]],
  [[0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [1, 0], [1, 1], [1, 2]],
  [[0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [1, 0], [1, 1], [1, 2], [1, 3]],
  [[0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [1, 0], [1, 1], [1, 2], [1, 3], [1, 4]],
  [[0, 6], [0, 7], [0, 8], [0, 9], [1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5]],
  [[0, 7], [0, 8], [0, 9], [1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6]],
  [[0, 8], [0, 9], [1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7]],
  [[0, 9], [1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8]],
  [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9]],
]

/**
 * 半加算機（1桁の加算）
 * @internal
 */
type __Add_d<X extends DIGIT, Y extends DIGIT, C extends 0|1> =
  __PLUS_MAP[C extends 1 ? [1,2,3,4,5,6,7,8,9,10][X] : X][Y]

/**
 * 全加算機（数字配列の加算、Xの桁数がY以上であることを前提）
 * @internal
 */
type __Add_rec<X extends DIGIT[], Y extends DIGIT[], C extends 0|1 = 0> =
  X extends [...infer Xr extends DIGIT[], infer X1 extends DIGIT] ?
    Y extends [...infer Yr extends DIGIT[], infer Y1 extends DIGIT] ?
      __Add_d<X1, Y1, C> extends [infer Cn extends 0 | 1, infer Zn extends DIGIT] ? [...__Add_rec<Xr, Yr, Cn>, Zn] : never
    : __Add_d<X1, 0, C> extends [infer Cn extends 0 | 1, infer Zn extends DIGIT] ? [...__Add_rec<Xr, [], Cn>, Zn] : never
  : C extends 1 ? [1] : []

/**
 * 正規化された数字配列の加算
 * @internal
 */
type __Add<X extends NORM_DIGITS, Y extends NORM_DIGITS> =
  __Nrm<keyof Y extends keyof X ? __Add_rec<X, Y> : __Add_rec<Y, X>>

/**
 * 9の補数を取る
 * @internal
 */
type __Complement<X extends DIGIT[]> =
  X extends [infer X1 extends DIGIT, ...infer Xr extends DIGIT[]] ? [[9,8,7,6,5,4,3,2,1,0][X1], ...__Complement<Xr>] : []

/**
 * 下からP桁目の位置でデクリメントする（10^P で引き算する）
 * @internal
 */
type __Dec_at<X extends NORM_DIGITS, P extends number, L extends NORM_DIGITS = X, R extends DIGIT[] = []> =
  R['length'] extends P ?
    [...__Dec<L>, ...R]
  : L extends [...infer Ln extends NORM_DIGITS, infer C extends DIGIT] ?
    __Dec_at<X, P, Ln, [C, ...R]>
  : []

/**
 * 正規化された数字配列の減算（X > Y を前提）
 * @internal
 */
type __Sub<X extends NORM_DIGITS, Y extends NORM_DIGITS> =
  __Nrm<__Dec_at<__Add<__Inc<X>, __Nrm<__Complement<Y>>>, Y['length']>>

/**
 * 乗算用の九九表
 * @internal
 */
type __MUL_TABLE = [
[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
[[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9]],
[[0,0],[0,2],[0,4],[0,6],[0,8],[1,0],[1,2],[1,4],[1,6],[1,8]],
[[0,0],[0,3],[0,6],[0,9],[1,2],[1,5],[1,8],[2,1],[2,4],[2,7]],
[[0,0],[0,4],[0,8],[1,2],[1,6],[2,0],[2,4],[2,8],[3,2],[3,6]],
[[0,0],[0,5],[1,0],[1,5],[2,0],[2,5],[3,0],[3,5],[4,0],[4,5]],
[[0,0],[0,6],[1,2],[1,8],[2,4],[3,0],[3,6],[4,2],[4,8],[5,4]],
[[0,0],[0,7],[1,4],[2,1],[2,8],[3,5],[4,2],[4,9],[5,6],[6,3]],
[[0,0],[0,8],[1,6],[2,4],[3,2],[4,0],[4,8],[5,6],[6,4],[7,2]],
[[0,0],[0,9],[1,8],[2,7],[3,6],[4,5],[5,4],[6,3],[7,2],[8,1]],
]

/**
 * N桁 × 1桁の乗算
 * @internal
 */
type __Mul_d<X extends DIGIT[], Y extends DIGIT, C extends DIGIT=0> =
  X extends [...infer Xr extends DIGIT[], infer X1 extends DIGIT] ?
    __Add_rec<__MUL_TABLE[X1][Y], [C]> extends [infer Cn extends DIGIT, infer Z extends DIGIT] ?
      [...__Mul_d<Xr, Y, Cn>, Z]
    : never
  : C extends 0 ? [] : [C]

/**
 * 正規化された数字配列の乗算
 * @internal
 */
type __Mul<X extends NORM_DIGITS, Y extends NORM_DIGITS> =
  Y extends [...infer Yr extends NORM_DIGITS, infer Y1 extends DIGIT]?
    __Add<__Nrm<[...__Mul<X, Yr>, 0]>, __Nrm<__Mul_d<X, Y1>>>
  : []

/**
 * 反復減法により1桁分の商と余を求める
 * @internal
 */
type __DivMod_d<X extends NORM_DIGITS, Y extends POS_DIGITS, D extends DIGIT = 0> =
  __Gte<X, Y> extends true ? __DivMod_d<__Sub<X, Y>, Y, __Inc_d<D>> : {div: D, mod: X}

/**
 * 長除法による除算の再帰実装
 * @internal
 */
type __DivMod<X extends NORM_DIGITS, Y extends POS_DIGITS> =
  keyof X extends keyof Y ? // XとYの桁数が同じになったら割り算を開始
    __DivMod_d<X, Y> extends {div: infer D extends DIGIT, mod: infer M extends NORM_DIGITS} ?
      {div: D extends NZDIGIT ? [D] : [], mod: M}
    : never
  : X extends [...infer Xr extends NORM_DIGITS, infer X1 extends DIGIT] ?
    __DivMod<Xr, Y> extends {div: infer Div extends NORM_DIGITS, mod: infer Mod extends NORM_DIGITS} ?
      [...Mod, X1] extends infer Xn extends NORM_DIGITS ?
        __DivMod_d<Xn, Y> extends {div: infer D extends DIGIT, mod: infer M extends NORM_DIGITS} ?
          {div: __Nrm<[...Div, D]>, mod: M}
        : never
      : {div: [...Div, 0], mod: []}
    : never
  : never

// ============================================================================
// 内部型演算（IntBase10Type レベル）
// ============================================================================

/**
 * IntBase10Typeの符号反転
 * @internal
 */
type _Neg<N extends IntBase10Type> = 
  N extends PosIntBase10Type ? {p: [], n: N['p']} : N extends NegIntBase10Type ? {p: N['n'], n: []} : IntBase10Zero

/**
 * IntBase10Typeの絶対値
 * @internal
 */
type _Abs<N extends IntBase10Type> = IsNeg<N> extends true ? Neg<N> : N

/**
 * IntBase10Typeの符号関数
 * @internal
 */
type _Sgn<N extends IntBase10Type> =
  N extends PosIntBase10Type ? IntBase10One : N extends NegIntBase10Type ? Neg<IntBase10One> : IntBase10Zero

/**
 * IntBase10Typeのインクリメント
 * @internal
 */
type _Inc<N extends IntBase10Type> =
  N extends NegIntBase10Type ? {p: [], n: __Dec<N['n']>} : {p: __Inc<N['p']>, n: []}

/**
 * IntBase10Typeのデクリメント
 * @internal
 */
type _Dec<N extends IntBase10Type> =
  N extends PosIntBase10Type ? {p: __Dec<N['p']>, n: []} : {p: [], n: __Inc<N['n']>}

/**
 * IntBase10Typeの大小比較
 * @internal
 */
type _Gt<X extends IntLike, Y extends IntLike> =
  X extends PosIntBase10Type ? Y extends PosIntBase10Type ? __Gt<X['p'], Y['p']> : true
  : X extends IntBase10Zero ? Y extends NegIntBase10Type ? true : false
  : X extends NegIntBase10Type ? Y extends NegIntBase10Type ? __Gt<Y['n'], X['n']> : false
  : never

/**
 * IntBase10Typeの加算
 * @internal
 */
type _Add<X extends IntBase10Type, Y extends IntBase10Type> = 
  X extends IntBase10Zero ? Y
  : X extends NegIntBase10Type ? _Neg<_Add<Neg<X>, Neg<Y>>>
  : X extends PosIntBase10Type ?
    Y extends PosIntBase10Type ? {p: __Add<X['p'], Y['p']>, n: []}
    : Y extends NegIntBase10Type ?
      __Gte<X['p'], Y['n']> extends true ?
        {p: __Sub<X['p'], Y['n']>, n: []}
      : {p: [], n: __Sub<Y['n'], X['p']>}
    : X
  : never

/**
 * IntBase10Typeの乗算
 * @internal
 */
type _Mul<X extends IntBase10Type, Y extends IntBase10Type> =
  X extends IntBase10Zero ? IntBase10Zero
  : X extends NegIntBase10Type ? _Mul<_Neg<X>, _Neg<Y>>
  : X extends PosIntBase10Type ?
    Y extends PosIntBase10Type ? {p: __Mul<X['p'], Y['p']>, n: []}
    : Y extends NegIntBase10Type ? {p: [], n: __Mul<X['p'], Y['n']>}
    : IntBase10Zero
  : never

/**
 * IntBase10Typeの除算と剰余
 * @internal
 */
type _DivMod<X extends IntBase10Type, Y extends IntBase10Type> =
  Y extends IntBase10Zero ? never
  : Y extends NegIntBase10Type ?
    _DivMod<X, _Neg<Y>> extends infer DM extends {div: IntBase10Type, mod: IntBase10Type}?
      {div: _Neg<DM["div"]>, mod: DM["mod"]}
    : never
  : Y extends PosIntBase10Type ?
    X extends IntBase10Zero ?
      {div: IntBase10Zero, mod: IntBase10Zero}
    : X extends PosIntBase10Type ?
      __DivMod<X["p"], Y["p"]> extends {div: infer D extends NORM_DIGITS, mod: infer M extends NORM_DIGITS} ?
        {div: {p: D, n: []}, mod: {p: M, n: []}}
      : never
    : X extends NegIntBase10Type ?
      __DivMod<X["n"], Y["p"]> extends {div: infer D extends NORM_DIGITS, mod: infer M extends NORM_DIGITS} ?
        {div: {p: [], n: __Inc<D>}, mod: {p: __Sub<Y["p"], M>, n: []}}
      : never
    : never
  : never

// ============================================================================
// 公開API - 型変換・コンストラクタ
// ============================================================================

/**
 * 整数値からIntBase10型を構築します
 * @template I - 変換する整数値（number | bigint | string | IntBase10Type）
 * @returns IntBase10Type形式の整数
 * @example
 * ```typescript
 * type Ten = IntBase10<10>        // {p: [1, 0], n: []}
 * type MinusOne = IntBase10<-1>   // {p: [], n: [1]}
 * type Zero = IntBase10<0>        // {p: [], n: []}
 * ```
 */
export type IntBase10<I extends IntLike> = _I<I>

/**
 * IntBase10型を文字列に変換します
 * @template X - 変換するIntBase10型
 * @returns 文字列表現
 * @example
 * ```typescript
 * type Result = IntBase10toS<IntBase10<123>>  // "123"
 * ```
 */
export type IntBase10toS<X extends IntBase10Type> = _ToS<X>

/**
 * IntBase10型を数値に変換します
 * @template X - 変換するIntBase10型
 * @returns 数値表現
 * @example
 * ```typescript
 * type Result = IntBase10toN<IntBase10<"456">>  // 456
 * ```
 */
export type IntBase10toN<X extends IntBase10Type> = _ToN<X>

/**
 * IntBase10型をbigintに変換します
 * @template X - 変換するIntBase10型
 * @returns bigint表現
 * @example
 * ```typescript
 * type Result = IntBase10toBI<IntBase10<"12345678901234567890">>  // 12345678901234567890n
 * ```
 */
export type IntBase10toBI<X extends IntBase10Type> = _ToBI<X>

// ============================================================================
// 公開API - 定数
// ============================================================================

/**
 * ゼロを表す定数
 */
export type ZERO = IntBase10Zero

/**
 * 1を表す定数
 */
export type ONE = IntBase10<1>

/**
 * -1を表す定数
 */
export type NEG_ONE = IntBase10<-1>

/**
 * 正の整数型を表す定数
 */
export type POS = PosIntBase10Type

/**
 * 負の整数型を表す定数
 */
export type NEG = NegIntBase10Type

// ============================================================================
// 公開API - 述語・判定
// ============================================================================

/**
 * 整数が正の値かどうかを判定します
 * @template N - 判定する整数
 * @returns 正の値の場合true、それ以外はfalse
 * @example
 * ```typescript
 * type Result1 = IsPos<5>   // true
 * type Result2 = IsPos<-3>  // false
 * type Result3 = IsPos<0>   // false
 * ```
 */
export type IsPos<N extends IntLike> = _I<N> extends PosIntBase10Type ? true : false

/**
 * 整数が負の値かどうかを判定します
 * @template N - 判定する整数
 * @returns 負の値の場合true、それ以外はfalse
 * @example
 * ```typescript
 * type Result1 = IsNeg<-5>  // true
 * type Result2 = IsNeg<3>   // false
 * type Result3 = IsNeg<0>   // false
 * ```
 */
export type IsNeg<N extends IntLike> = _I<N> extends NegIntBase10Type ? true : false

/**
 * 整数がゼロかどうかを判定します
 * @template N - 判定する整数
 * @returns ゼロの場合true、それ以外はfalse
 * @example
 * ```typescript
 * type Result1 = IsZero<0>   // true
 * type Result2 = IsZero<1>   // false
 * type Result3 = IsZero<-1>  // false
 * ```
 */
export type IsZero<N extends IntLike> = _I<N> extends IntBase10Zero ? true : false

/**
 * 整数が非負の値（0以上）かどうかを判定します
 * @template N - 判定する整数
 * @returns 非負の値の場合true、負の値の場合false
 * @example
 * ```typescript
 * type Result1 = IsNonNeg<5>   // true
 * type Result2 = IsNonNeg<0>   // true
 * type Result3 = IsNonNeg<-3>  // false
 * ```
 */
export type IsNonNeg<N extends IntLike> = _I<N> extends NegIntBase10Type ? false : true

// ============================================================================
// 公開API - 単項演算
// ============================================================================

/**
 * 整数の符号を反転します
 * @template N - 符号反転する整数
 * @returns 符号が反転された整数（Nと同じ型で返却）
 * @example
 * ```typescript
 * type Result1 = Neg<5>    // -5
 * type Result2 = Neg<-3>   // 3
 * type Result3 = Neg<0>    // 0
 * ```
 */
export type Neg<N extends IntLike> = _O<_Neg<_I<N>>, N>

/**
 * 整数の絶対値を取得します
 * @template N - 絶対値を取る整数
 * @returns 絶対値（Nと同じ型で返却）
 * @example
 * ```typescript
 * type Result1 = Abs<-5>   // 5
 * type Result2 = Abs<3>    // 3
 * type Result3 = Abs<0>    // 0
 * ```
 */
export type Abs<N extends IntLike> = _O<_Abs<_I<N>>, N>

/**
 * 整数の符号を取得します（-1, 0, 1のいずれか）
 * @template N - 符号を取得する整数
 * @returns -1（負）、0（ゼロ）、1（正）のいずれか（Nと同じ型で返却）
 * @example
 * ```typescript
 * type Result1 = Sgn<-5>   // -1
 * type Result2 = Sgn<0>    // 0
 * type Result3 = Sgn<3>    // 1
 * ```
 */
export type Sgn<N extends IntLike> = _O<_Sgn<_I<N>>, N>

/**
 * 整数を1増加させます
 * @template N - インクリメントする整数
 * @returns N + 1の結果（Nと同じ型で返却）
 * @example
 * ```typescript
 * type Result1 = Inc<5>    // 6
 * type Result2 = Inc<-1>   // 0
 * type Result3 = Inc<0>    // 1
 * ```
 */
export type Inc<N extends IntLike> = _O<_Inc<_I<N>>, N>

/**
 * 整数を1減少させます
 * @template N - デクリメントする整数
 * @returns N - 1の結果（Nと同じ型で返却）
 * @example
 * ```typescript
 * type Result1 = Dec<5>    // 4
 * type Result2 = Dec<1>    // 0
 * type Result3 = Dec<0>    // -1
 * ```
 */
export type Dec<N extends IntLike> = _O<_Dec<_I<N>>, N>

// ============================================================================
// 公開API - 比較演算
// ============================================================================

/**
 * 二つの整数が等しいかどうかを判定します
 * @template X - 第一オペランド
 * @template Y - 第二オペランド
 * @returns X == Yの場合true、それ以外はfalse
 * @example
 * ```typescript
 * type Result1 = Eq<5, 5>     // true
 * type Result2 = Eq<3, 7>     // false
 * type Result3 = Eq<"10", 10> // true
 * ```
 */
export type Eq<X extends IntLike, Y extends IntLike> = [_I<X>] extends [_I<Y>] ? true : false

/**
 * 第一オペランドが第二オペランドより大きいかどうかを判定します
 * @template X - 第一オペランド
 * @template Y - 第二オペランド
 * @returns X > Yの場合true、それ以外はfalse
 * @example
 * ```typescript
 * type Result1 = Gt<5, 3>   // true
 * type Result2 = Gt<2, 7>   // false
 * type Result3 = Gt<5, 5>   // false
 * ```
 */
export type Gt<X extends IntLike, Y extends IntLike> = _Gt<_I<X>, _I<Y>>

/**
 * 第一オペランドが第二オペランド以上かどうかを判定します
 * @template X - 第一オペランド
 * @template Y - 第二オペランド
 * @returns X >= Yの場合true、それ以外はfalse
 * @example
 * ```typescript
 * type Result1 = Gte<5, 3>  // true
 * type Result2 = Gte<5, 5>  // true
 * type Result3 = Gte<2, 7>  // false
 * ```
 */
export type Gte<X extends IntLike, Y extends IntLike> = Eq<X, Y> extends true ? true : Gt<X, Y>

/**
 * 第一オペランドが第二オペランドより小さいかどうかを判定します
 * @template X - 第一オペランド
 * @template Y - 第二オペランド
 * @returns X < Yの場合true、それ以外はfalse
 * @example
 * ```typescript
 * type Result1 = Lt<3, 5>   // true
 * type Result2 = Lt<7, 2>   // false
 * type Result3 = Lt<5, 5>   // false
 * ```
 */
export type Lt<X extends IntLike, Y extends IntLike> = Gt<Y, X>

/**
 * 第一オペランドが第二オペランド以下かどうかを判定します
 * @template X - 第一オペランド
 * @template Y - 第二オペランド
 * @returns X <= Yの場合true、それ以外はfalse
 * @example
 * ```typescript
 * type Result1 = Lte<3, 5>  // true
 * type Result2 = Lte<5, 5>  // true
 * type Result3 = Lte<7, 2>  // false
 * ```
 */
export type Lte<X extends IntLike, Y extends IntLike> = Gte<Y, X>

// ============================================================================
// 公開API - 二項演算
// ============================================================================

/**
 * 二つの整数を加算します
 * @template X - 第一オペランド（number | bigint | string | IntBase10Type）
 * @template Y - 第二オペランド（number | bigint | string | IntBase10Type）
 * @returns X + Y の結果（Xと同じ型で返却）
 * @example
 * ```typescript
 * type Result1 = Add<123, 456>    // 579
 * type Result2 = Add<"999", "1">  // "1000"
 * type Result3 = Add<-5, 3>       // -2
 * ```
 */
export type Add<X extends IntLike, Y extends IntLike> = _O<_Add<_I<X>, _I<Y>>, X>

/**
 * 二つの整数を減算します
 * @template X - 被減数（number | bigint | string | IntBase10Type）
 * @template Y - 減数（number | bigint | string | IntBase10Type）
 * @returns X - Y の結果（Xと同じ型で返却）
 * @example
 * ```typescript
 * type Result1 = Sub<456, 123>    // 333
 * type Result2 = Sub<"100", "1">  // "99"
 * type Result3 = Sub<3, 5>        // -2
 * ```
 */
export type Sub<X extends IntLike, Y extends IntLike> = _O<_Add<_I<X>, Neg<_I<Y>>>, X>

/**
 * 二つの整数を乗算します
 * @template X - 第一オペランド（number | bigint | string | IntBase10Type）
 * @template Y - 第二オペランド（number | bigint | string | IntBase10Type）
 * @returns X * Y の結果（Xと同じ型で返却）
 * @example
 * ```typescript
 * type Result1 = Mul<12, 34>      // 408
 * type Result2 = Mul<"999", 2>    // "1998"
 * type Result3 = Mul<-5, 3>       // -15
 * ```
 */
export type Mul<X extends IntLike, Y extends IntLike> = _O<_Mul<_I<X>, _I<Y>>, X>

/**
 * 二つの整数の除算と剰余を同時に計算します
 * @template X - 被除数（number | bigint | string | IntBase10Type）
 * @template Y - 除数（number | bigint | string | IntBase10Type）
 * @returns {div: 商, mod: 余り} の形式（各値はXと同じ型で返却）
 * @example
 * ```typescript
 * type Result1 = DivMod<17, 5>    // {div: 3, mod: 2}
 * type Result2 = DivMod<"100", 3> // {div: "33", mod: "1"}
 * ```
 */
export type DivMod<X extends IntLike, Y extends IntLike> =
  _DivMod<_I<X>, _I<Y>> extends infer DM extends {div: IntBase10Type, mod: IntBase10Type} ?
    {div: _O<DM["div"], X>, mod: _O<DM["mod"], X>}
  : never

/**
 * 二つの整数を除算します（商のみ）
 * @template X - 被除数（number | bigint | string | IntBase10Type）
 * @template Y - 除数（number | bigint | string | IntBase10Type）
 * @returns X ÷ Y の商（Xと同じ型で返却）
 * @example
 * ```typescript
 * type Result1 = Div<17, 5>       // 3
 * type Result2 = Div<"100", 3>    // "33"
 * type Result3 = Div<-10, 3>      // -4
 * ```
 */
export type Div<X extends IntLike, Y extends IntLike> = DivMod<X, Y>["div"]

/**
 * 二つの整数の剰余を計算します
 * @template X - 被除数（number | bigint | string | IntBase10Type）
 * @template Y - 除数（number | bigint | string | IntBase10Type）
 * @returns X ÷ Y の余り（Xと同じ型で返却）
 * @example
 * ```typescript
 * type Result1 = Mod<17, 5>       // 2
 * type Result2 = Mod<"100", 3>    // "1"
 * type Result3 = Mod<-10, 3>      // 2
 * ```
 */
export type Mod<X extends IntLike, Y extends IntLike> = DivMod<X, Y>["mod"]
