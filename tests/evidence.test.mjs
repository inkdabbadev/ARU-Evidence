import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../src/state/evidence.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};vm.runInNewContext(`(function(exports){${code}})`)(module.exports);
const {normalizeEvidence,collectEvidence}=module.exports;
test('out-of-order pieces cannot duplicate or fill another section',()=>{
 let ids=[];for(const id of [6,2,6,2,1,5,3,4])ids=collectEvidence(ids,id);
 assert.equal(ids.length,6);assert.equal(new Set(ids).size,6);
 assert.deepEqual([...collectEvidence([],6)],[6]);assert.deepEqual([...collectEvidence(ids,7)],[...ids]);
});
test('legacy count migration is bounded; explicit IDs are authoritative',()=>{
 assert.deepEqual([...normalizeEvidence(undefined,3)],[1,2,3]);
 assert.deepEqual([...normalizeEvidence([6,6,2,0,7,'1'],6)],[6,2]);
 assert.equal(normalizeEvidence(undefined,Infinity).length,0);assert.equal(normalizeEvidence(undefined,99).length,6);
 assert.equal(normalizeEvidence([],6).length,0);
});
test('every collection room awards its own fixed ID',()=>{
 const names=['Piece1QuizRoom','Piece2ShowsRoom','Piece3ConnectionsRoom','Piece4HouseArrestRoom','Piece5LaterRoom','Piece6DoNothingRoom'];
 names.forEach((name,i)=>{const room=fs.readFileSync(new URL(`../src/rooms/${name}.tsx`,import.meta.url),'utf8');assert.ok(room.includes(`addPiece(${i+1})`));assert.ok(!room.includes('piecesFound <'));});
});
