/*:
 * @target MZ
 * @plugindesc Permit use of _originalPattern for non-event characters.
 * @author Caethyril
 * @url https://forums.rpgmakerweb.com/threads/159233/
 * @help Free to use and/or modify for any project, no credit required.
 */
void (alias => {
  Game_CharacterBase.prototype.isOriginalPattern = function() {
    if ("_originalPattern" in this)
      return this.pattern() === this._originalPattern;
    return alias.apply(this, arguments);
  };
})(Game_CharacterBase.prototype.isOriginalPattern);

void (alias => {
  Game_CharacterBase.prototype.resetPattern = function() {
    alias.apply(this, arguments);  // better odds of cross-compatibility
    if ("_originalPattern" in this)
      this.setPattern(this._originalPattern);
  };
})(Game_CharacterBase.prototype.resetPattern);
