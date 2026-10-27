/* Pagine scritte a mano della wiki (le tabelle vengono dai dati del gioco). Voxel World 0.3.2 beta. */
window.WIKI_PAGES = {

'per-iniziare': { title: 'Per iniziare', html: `
<p class="intro">I primi dieci minuti in Voxel World, passo per passo.</p>
<ol class="timeline">
<li><b>Prepara l'eroe</b>Dal menu guarda il <b>Tutorial</b> (è un film animato) e apri <b>Personaggio</b>: scegli razza, classe, aspetto e distribuisci gli attributi. Puoi cambiare tutto quando vuoi.</li>
<li><b>Crea un mondo</b><b>Nuovo mondo</b> → <b>Creativo</b> (tutti i blocchi, volo, invulnerabile) oppure <b>Sopravvivenza</b> (parti a mani vuote, scavi, fabbrichi, rischi la pelle). Il seed dà sempre lo stesso mondo.</li>
<li><b>Muoviti</b><code>W A S D</code> cammini, <code>Maiusc</code> corri (dopo un secondo diventi una vera corsa), <code>Spazio</code> salti, <code>Alt</code> rotoli. <code>T</code> passa alla terza persona.</li>
<li><b>Apri il libro</b><code>E</code> è il Libro dell'Eroe: equipaggiamento, set, armi, zaino, Artigiano, reliquie, arti, diario, imprese, cronaca. <code>G</code> è il Grimorio degli incantesimi. <code>F1</code> è la guida in gioco.</li>
<li><b>Sopravvivenza: il primo giorno</b>Tieni premuto il tasto sinistro su un albero per rompere il tronco; raccogli i blocchi camminandoci sopra. Fai le assi, i bastoni e un <b>banco da lavoro</b>, poi un piccone di legno: con quello scavi la pietra e passi alla pietra, al ferro e oltre. Costruisci un riparo prima di sera e metti delle torce.</li>
</ol>
<div class="callout tip"><b>Consiglio.</b> Non buttarti nelle caverne senza torce e cibo: sottoterra è davvero buio, e la fame fa smettere la salute di tornare.</div>
<div class="callout warn"><b>Se muori in Sopravvivenza</b> la borsa resta dove sei caduto, in una <a href="#/sopravvivenza">tomba</a> segnata da una colonna di luce. Torni al punto di partenza con ciò che indossi, le magie e i livelli.</div>
`},

'controlli': { title: 'Controlli', html: `
<p class="intro">Tutti i comandi, esattamente come nella guida in gioco (<code>F1</code>).</p>
<div data-guide="Comandi"></div>
<div class="callout tip"><b>Trucchi di movimento.</b> Dopo circa un secondo di corsa passi a una vera corsa, più veloce. In aria tieni <code>Spazio</code> per planare. Contro un muro di due blocchi, <code>Spazio</code> ti arrampica. Il ghiaccio è scivoloso: frena in anticipo.</div>
<div class="callout tip"><b>Novità.</b> <code>Q</code> scambia con l'arma impugnata prima, la rotella scorre i nove slot della barra (le armi stanno lì, insieme ai blocchi). <code>F2</code> nasconde l'interfaccia (modalità foto), <code>F12</code> salva uno screenshot PNG nella cartella <code>screenshots</code>. Tasto destro su un abitante di un villaggio per parlarci.</div>
<div class="callout"><b>Con gli amici.</b> In multiplayer <code>T</code> è la chat: la terza persona si cambia con <code>F5</code>.</div>
`},

'modalita': { title: 'Creativo e Sopravvivenza', html: `
<p class="intro">Due modi di giocare con lo stesso mondo, e due eroi separati: ogni mondo di Sopravvivenza ha il suo eroe che parte da zero.</p>
<div class="tw"><table class="t"><thead><tr><th></th><th>Creativo</th><th>Sopravvivenza</th></tr></thead><tbody>
<tr><td><b>Blocchi e oggetti</b></td><td>Tutti nel catalogo, infiniti, a portata di mano</td><td>Zaino vuoto: scavi, raccogli, fabbrichi</td></tr>
<tr><td><b>Eroe</b></td><td>Invulnerabile, mana e stamina infiniti, ogni magia, arma, armatura e trofeo già tuoi</td><td>Livello 1, la tua forza dipende da ciò che trovi e fabbrichi</td></tr>
<tr><td><b>Volo</b></td><td>Sì (doppio Spazio)</td><td>No, solo planata e cavalcature volanti</td></tr>
<tr><td><b>Fame, clima, usura</b></td><td>No</td><td>Sì</td></tr>
<tr><td><b>Armi migliori</b></td><td>Già disponibili</td><td>Servono schemi, Forgia, materiali; i guardiani lasciano reliquie</td></tr>
<tr><td><b>Magie</b></td><td>Tutte subito</td><td>Si studiano (schegge ed essenze) e migliorano usandole</td></tr>
<tr><td><b>Morte</b></td><td>Non si muore</td><td>La borsa resta in una tomba</td></tr>
</tbody></table></div>
<div class="callout"><b>Imprese e salvataggi.</b> Le Imprese, i progressi e i salvataggi sono per mondo in Sopravvivenza. I mondi si salvano da soli (e con il menu di pausa, ESC).</div>
`},

'strutture': { title: 'Strutture e regni', html: `
<p class="intro">Il mondo grande è pieno di luoghi da scoprire. Il comando <code>/locate</code> ti porta al più vicino.</p>
<div class="cardgrid">
<div class="card"><h3>Cripte</h3><div class="sub">sottoterra · <code>/locate cripta</code></div><p>Nascoste sottoterra: tesori, forzieri antichi (con gli schemi) e un guardiano. Un forziere dorato si apre con il tasto destro; quello del guardiano resta sigillato finché non lo batti.</p></div>
<div class="card"><h3>Roccaforti</h3><div class="sub">in superficie · <code>/locate roccaforte</code></div><p>All'aperto e immense: statue di guardiani e un monolite che si vede da lontano. Custodiscono tesori e un guardiano.</p></div>
<div class="card"><h3>Castelli e piramidi</h3><div class="sub">uno per guardiano · <code>/locate castello</code></div><p>Castelli con fossato e ponte, piramidi nei deserti. Dentro c'è una guarnigione e in fondo la sala del trono.</p></div>
<div class="card"><h3>Regni abbandonati</h3><div class="sub"><code>/locate rovine</code></div><p>Città morte con palazzo e cattedrale, e un re che dorme sul trono. Pergamene tra le più rare.</p></div>
<div class="card"><h3>Regni nel cielo</h3><div class="sub">isole sopra le nuvole</div><p>Villaggi, biblioteche, mulini e il Sovrano delle Tempeste. Una colonna di vento da un altare a terra ti ci porta.</p></div>
<div class="card"><h3>Dojo</h3><div class="sub"><code>/locate dojo</code></div><p>Nei boschi di ciliegi, nelle taighe, nelle pianure, nei deserti e sulle montagne del mondo grande: cortile di ghiaia con il torii, laghetto, quattro manichini e la sala del maestro. Qui alleni le arti marziali.</p></div>
<div class="card"><h3>La Cittadella</h3><div class="sub"><code>/locate cittadella</code></div><p>Una sola per mondo, lontana: ci vive il Re Eterno. Per risvegliarlo servono i sigilli dei guardiani (tre bastano).</p></div>
</div>
<p>I mondi grandi hanno anche caverne a tema (ghiaccio, sabbia, cristallo, funghi, magma, mare) e alberi colossali.</p>
`},

'cavalcature': { title: 'Cavalcature', html: `
<p class="intro">Cavallo, zebra, cervo, cammello, giraffa, unicorno e grifone: tutti si possono montare.</p>
<ul>
<li><b>Domare:</b> tasto destro su una creatura selvatica con del cibo in mano. In Creativo si doma subito, in Sopravvivenza il cibo viene mangiato e il successo dipende dalla specie (l'unicorno si fida pochissimo).</li>
<li><b>Salire e scendere:</b> tasto destro su una cavalcatura addomesticata; <code>Backspace</code> per scendere.</li>
<li><b>Chiamarla:</b> <code>J</code> richiama l'ultima addomesticata da dove ti trovi.</li>
<li><b>Evocarla:</b> gli incantesimi <i>Destriero di Vento</i>, <i>Unicorno Astrale</i> e <i>Grifone Celeste</i> evocano una cavalcatura spettrale che svanisce. Il grifone vola: Spazio sale, Maiusc scende, e non ti lascia cadere dal cielo finché non atterri.</li>
</ul>
<div data-table="mounts"></div>
`},

'combattimento': { title: 'Combattimento', html: `
<p class="intro">Il combattimento è fatto di ritmo: colpi concatenati, parate al momento giusto e schivate che rallentano il tempo.</p>
<h2>Colpi e catene</h2>
<p>Ogni arma colpisce in catena: clicca di nuovo mentre il colpo finisce e passi al successivo. La <b>spada</b> taglia da destra, da sinistra e chiude con il Fendente Finale; la <b>lancia</b> affonda due volte e infilza; il <b>pugnale</b> sfregia quattro volte. Il colpo finale pesa di più e colpisce un nemico in più. Le arti marziali aggiungono mosse alla catena (al rango 4 e al 7) e al rango 6 il finale spacca il terreno.</p>
<h2>Parata perfetta</h2>
<p>Tieni premuto il tasto destro con l'arma in mano: un istante dopo aver alzato la guardia, un colpo che arriva viene deviato del tutto. Il nemico resta scoperto, ti torna stamina e il tuo prossimo colpo è un <b>Contrattacco</b> (più del doppio del danno, sempre critico). Una guardia alzata in ritardo assorbe solo una parte del colpo e costa stamina; senza stamina la guardia si spezza.</p>
<h2>Schivata perfetta</h2>
<p>La rotolata (<code>Alt</code>) ti rende intoccabile per un attimo. Se un colpo ti sfiora proprio allora, il tempo rallenta per un secondo, ti torna un po' di stamina e il prossimo colpo è un critico.</p>
<h2>Boss</h2>
<p>I guardiani hanno più fasi e attacchi <b>telegrafati</b>: un'ombra o un bagliore avvisa prima del colpo. Impara il ritmo, para o rotola nel momento giusto, e colpisci quando hanno appena attaccato.</p>
<div class="callout tip"><b>Costruisci il tuo stile.</b> Armi veloci (pugnale) sono ottime per i critici e le parate; armi pesanti (martello, ascia) colpiscono più forte ma lasciano scoperti. Vedi <a href="#/armi">Armi</a> e <a href="#/arti">Arti marziali</a>.</div>
`},

'magia': { title: 'Guida alla magia', html: `
<p class="intro">Sei scuole di magia, una settima segreta e cinquantaquattro incantesimi.</p>
<h2>Le scuole</h2>
<p>Fuoco, Ghiaccio, Vento, Terra, Oscura e Spaziale (la più potente, si sblocca per ultima), più la scuola segreta dorata dei <a href="#/domini">Domini</a>. Ogni scuola usa un attributo (Intelletto per quasi tutte) e ha degli incantesimi di grado da 1 a 6.</p>
<h2>Mana e stamina</h2>
<p>Gli incantesimi costano <b>mana</b>; i più forti anche <b>stamina</b>. Dopo ogni lancio c'è un tempo di recupero. L'Intelletto alza mana e recupero, il Vigore stamina e salute. Alcuni equipaggiamenti riducono il costo.</p>
<h2>Affinità dei biomi</h2>
<p>Ogni luogo favorisce certe scuole: il fuoco è più forte nel deserto e nel vulcano, il ghiaccio nella tundra. Il Grimorio mostra il bonus del posto in cui sei.</p>
<h2>Imparare (in Sopravvivenza)</h2>
<p>Il livello e gli attributi dicono cosa <i>puoi</i> imparare; per i gradi sopra il primo devi anche <b>studiare</b> la magia dal Grimorio (<code>G</code>), pagando con materiali:</p>
<div class="tw"><table class="t"><thead><tr><th>Grado</th><th>Costo dello studio</th></tr></thead><tbody>
<tr><td class="n">1</td><td>Gratis</td></tr><tr><td class="n">2</td><td>2 Schegge di cristallo</td></tr><tr><td class="n">3</td><td>4 Schegge + 1 Polvere di farfalla</td></tr>
<tr><td class="n">4</td><td>6 Schegge + 1 Essenza eterea</td></tr><tr><td class="n">5</td><td>8 Schegge + 2 Essenze eteree + 1 Polvere di unicorno</td></tr><tr><td class="n">6</td><td>10 Schegge + 3 Essenze eteree + 1 Fiamma di kitsune</td></tr>
</tbody></table></div>
<p>Le magie segrete si imparano dalle pergamene dei guardiani. Le essenze le lasciano creature rare (spiriti, unicorni, kitsune).</p>
<h2>Maestria</h2>
<p>Ogni magia migliora usandola: ai lanci 12, 45, 120, 260 e 500 sale di un grado di maestria (fino a 5). Ogni grado dà <b>+4% di potenza</b> e <b>−4% di mana</b>.</p>
<div class="callout"><b>Slot rapidi.</b> Assegna fino a sei magie ai tasti <code>R F C V Y U</code> dal Grimorio: clic su un incantesimo, poi su uno slot.</div>
`},

'sopravvivenza': { title: 'Guida alla sopravvivenza', html: `
<p class="intro">In Sopravvivenza ogni cosa te la guadagni. Ecco come funziona tutto, nell'ordine in cui lo incontrerai.</p>
<h2>Scavare e fabbricare</h2>
<p>Si parte da zero: nello zaino hai solo una spada di legno, quattro torce e tre pani. Tutto il resto lo scavi e lo fabbrichi. Tieni premuto il tasto sinistro su un blocco per romperlo: il tempo dipende dal blocco e dallo strumento (piccone per pietra e minerali, ascia per il legno, pala per terra e sabbia). Il blocco cade e lo raccogli camminandoci sopra. Gli strumenti si consumano. All'<b>Artigiano</b> (<code>E</code>) fabbrichi: assi, bastoni, banco da lavoro, fornace, picconi (legno, pietra, ferro, mithril), armi e armature. Le ricette migliori vogliono il banco o la fornace vicino.</p>
<h2>Fame e cibo</h2>
<p>La fame cala col tempo e ancora di più correndo; senza cibo la salute non torna più e poi cala. Mangi con il tasto destro. La carne si cuoce nella fornace; stufati e dolci si fanno nella pentola da cucina e danno un effetto per qualche minuto. Coltivi con la zappa e i semi (erba alta, girasoli, funghi lunari…).</p>
<h2>Alchimia</h2>
<p>Raccogli erbe e fiori e ciò che lasciano le creature: sul tavolo alchemico unisci una fiala a due o tre ingredienti. Le pozioni rare (fenice, unicorno, potere arcano, fortuna, mente lucida) richiedono lo schema <i>Alchimia superiore</i>.</p>
<h2>Schemi e Forgia runica</h2>
<p>Le armi e armature migliori non si fabbricano subito: servono gli <a href="#/schemi">schemi</a>. Si trovano nei forzieri di cripte, roccaforti e castelli e dai guardiani (la tabella <a href="#/schemi">Schemi</a> dice dove). Le ricette bloccate compaiono scure nell'Artigiano e dicono dove cercare lo schema. La <b>Forgia runica</b> è il banco per mithril e scaglie di drago.</p>
<h2>Usura e riparazioni</h2>
<p>Armi e armature si consumano a ogni colpo dato o ricevuto: <a href="#/usura">leggi come funziona</a>. Si riparano all'Artigiano, nella scheda <b>Riparazioni</b>, con metà del materiale originale.</p>
<h2>Freddo e caldo</h2>
<p>Il corpo ha una temperatura (la barra sopra la fame). <a href="#/clima">Vedi cosa la cambia</a>: bioma, quota, notte, pioggia, vestiti, fuochi e ripari.</p>
<h2>La tomba</h2>
<p>Se muori, l'intero zaino resta dove sei caduto in una tomba segnata da una colonna di luce; sopra la barra del corpo vedi distanza e direzione. Torni al punto di partenza con ciò che indossi. Cammina fino alla tomba per riprendere tutto. Se ne tengono cinque: le più vecchie si perdono.</p>
<h2>Diario di Eldrin</h2>
<p>Sedici pagine del diario dello scriba del re sono sparse nei forzieri, dai guardiani e in alcune imprese. Raccogliendo le prime quindici si apre il <b>Sigillo</b>: +15% di danno al Re Eterno e −15% di quello che ti fa. Vedi il <a href="#/diario">Diario</a>.</p>
<h2>Caverne e luce</h2>
<p>Sottoterra c'è carbone, ferro, rame, stagno, argento, cobalto, oro, rosso, lapislazzuli, diamanti e i detriti antichi (solo in fondo), e in certe regioni i cinque <a href="#/minerali">cristalli rari</a>. Il minerale migliore vuole un piccone migliore. Sotto la roccia è buio: le torce illuminano sul serio.</p>
<h2>Villaggi, monete e missioni</h2>
<p>Nelle pianure, savane, taighe e deserti trovi <a href="#/villaggi">villaggi</a>: vi si compra e si vende con le monete, si accettano missioni e si fa amicizia per ottenere sconti. Dopo il Re Eterno, l'<a href="#/eredita">Eredità</a> risveglia il regno.</p>
`},

'clima': { title: 'Freddo e caldo', html: `
<p class="intro">In Sopravvivenza il corpo ha una temperatura da −1 (gelo) a +1 (torrido). Tende a quella che l'aria e i vestiti gli lasciano. Il comando <code>/clima</code> mostra i valori.</p>
<h2>Cosa cambia l'aria</h2>
<ul><li><b>Bioma:</b> tundra −0,78 · taiga −0,48 · montagna −0,30 · campi di cristallo −0,12 · pianure 0 · palude +0,08 · giungla +0,34 · savana +0,42 · calanchi +0,62 · deserto +0,72 · vulcano +0,95.</li>
<li><b>Quota:</b> sopra i 52 blocchi, più sali più fa freddo (fino a −0,45).</li><li><b>Notte:</b> −0,32 ovunque, ma nelle terre secche (deserto, calanchi, savana) fino a −0,9: giorno torrido, notte gelida.</li>
<li><b>Pioggia e neve:</b> fino a −0,26 · <b>acqua:</b> −0,34 · <b>caverne:</b> fresche e stabili (−0,14).</li></ul>
<h2>Cosa ti protegge</h2>
<div class="tw"><table class="t"><thead><tr><th>Materiale dei vestiti</th><th>Tiene il caldo</th><th>Tiene fuori il sole</th></tr></thead><tbody>
<tr><td>Lana</td><td class="n">0,10</td><td class="n">−0,04</td></tr><tr><td>Cuoio</td><td class="n">0,09</td><td class="n">−0,03</td></tr><tr><td>Brina eterna</td><td class="n">0,14</td><td class="n">—</td></tr>
<tr><td>Scaglie di drago</td><td class="n">0,07</td><td class="n">0,14</td></tr><tr><td>Lino elfico</td><td class="n">0,02</td><td class="n">0,17</td></tr><tr><td>Seta</td><td class="n">0,04</td><td class="n">0,14</td></tr>
<tr><td>Oro del sole</td><td class="n">—</td><td class="n">0,20</td></tr><tr><td>Ferro</td><td class="n">0,01</td><td class="n">−0,07</td></tr>
</tbody></table></div>
<p>Contano elmo, corazza, gambali, stivali, camicia, pantaloni e calzini. Un set completo di lana e cuoio vale circa 0,66 di protezione dal freddo.</p>
<p><b>Aiutano anche:</b> un fuoco vicino (torcia, fornace, forgia, pentola, magma), un tetto sopra la testa (meno vento, niente pioggia) e le pozioni di resistenza al fuoco contro il caldo.</p>
<h2>Cosa succede</h2>
<ul><li>Fresco/tiepido: nessun effetto.</li><li><b>Freddo o caldo</b> (oltre ±0,38): la salute guarisce a metà, mangi di più.</li><li><b>Congelamento o colpo di calore</b> (oltre ±0,72): niente guarigione e danni a intervalli, ma non fino alla morte.</li></ul>
`},

'usura': { title: 'Usura e riparazioni', html: `
<p class="intro">In Sopravvivenza armi e armature non sono eterne.</p>
<ul><li>Ogni colpo che <b>dai</b> con un'arma la consuma; ogni colpo che <b>subisci</b> consuma un pezzo d'armatura (il petto e lo scudo più degli altri).</li>
<li>Sotto il 25% un pezzo vale la metà. A zero <b>si spezza</b>: l'arma colpisce al 30% e un'armatura non dà più Potere, bonus né set.</li>
<li>Le reliquie dei guardiani, i gioielli e i vestiti non si consumano mai.</li></ul>
<div class="tw"><table class="t"><thead><tr><th>Cosa</th><th>Resistenza (colpi)</th></tr></thead><tbody>
<tr><td>Armi di legno / ferro / mithril / drago</td><td class="n">80 / 180 / 380 / 700</td></tr>
<tr><td>Armature di legno / cuoio</td><td class="n">100 / 120</td></tr><tr><td>Armature di ferro</td><td class="n">260</td></tr><tr><td>Armature di mithril</td><td class="n">480</td></tr><tr><td>Armature di drago</td><td class="n">800</td></tr></tbody></table></div>
<h2>Come si ripara</h2>
<p>All'Artigiano, scheda <b>Riparazioni</b>: compaiono solo i pezzi che ne hanno bisogno. Costo: <b>metà del materiale principale</b> con cui il pezzo si fabbrica, allo stesso banco (mithril e drago alla Forgia). Il pezzo torna al 100%. Tieni sempre del metallo di scorta.</p>
<p>La barra sotto lo slot dell'arma sull'HUD mostra la sua condizione; nel Libro dell'Eroe trovi la condizione nelle schede di armi e pezzi.</p>
`},

'multiplayer': { title: 'Multiplayer', html: `
<p class="intro">Il gioco è cooperativo: chi apre il mondo ne è l'host, gli amici si collegano a lui (fino a 8 giocatori, tutti con la stessa versione).</p>
<div class="callout"><b>Host.</b> Carica il mondo, premi <code>P</code> e scegli <i>Apri la partita agli amici</i> (o scrivi <code>/open</code>). Il pannello mostra il codice d'ingresso, l'indirizzo diretto e le regole: scontri tra giocatori, esperienza condivisa (il 60% va ai compagni vicini), bottino condiviso.</div>
<div class="callout tip"><b>Amico.</b> Dal menu: <i>Unisciti a un amico</i>, scrivi il codice (o l'indirizzo <code>ip:porta</code>) e premi Unisciti.</div>
<ul><li>Sulla stessa rete funziona subito (porta TCP 25566). Fuori rete, l'host deve inoltrare la porta o usare un <b>relay</b>.</li>
<li>Il <b>relay</b> è un piccolo programma su un computer raggiungibile da tutti: serve per usare i codici d'ingresso. Il suo indirizzo si imposta in <i>Impostazioni → Relay multigiocatore</i> (le istruzioni sono nel file <code>RELAY.md</code> del progetto). Senza relay si entra comunque con l'indirizzo diretto.</li><li>Chi gioca in compagnia resta padrone del proprio eroe: livelli e oggetti sono suoi in ogni mondo.</li>
<li><code>T</code> apre la chat, <code>/players</code> elenca chi c'è. Con gli amici il menu di pausa non ferma il mondo. Se l'host chiude, gli amici tornano al menu con un avviso.</li></ul>
`},

'console': { title: 'Console e comandi', html: `
<p class="intro">Premi <code>\\</code> (barra rovesciata) in gioco per aprire la console, <code>/help</code> per l'elenco. Sono strumenti di prova: funzionano quasi tutti in ogni modalità; quelli sulla fame, il clima o gli oggetti solo in Sopravvivenza.</p>
<div class="tw"><table class="t"><thead><tr><th>Comando</th><th>Cosa fa</th></tr></thead><tbody>
<tr><td><code>/help</code> · <code>/clear</code></td><td>Mostra l'elenco · pulisce la console</td></tr>
<tr><td><code>/tp x y z</code> · <code>/pos</code> · <code>/seed</code> · <code>/superficie</code></td><td>Teletrasporto · posizione · seed del mondo · all'aperto più vicino (se resti bloccato)</td></tr>
<tr><td><code>/time day|noon|night|midnight|secondi</code></td><td>Imposta l'ora</td></tr>
<tr><td><code>/weather</code> · <code>/meteo</code></td><td>Cambia il tempo: sereno, nuvoloso, pioggia, tempesta</td></tr>
<tr><td><code>/give &lt;blocco&gt;</code></td><td>Mette un blocco nello slot scelto (es. <code>/give oak wood</code>)</td></tr>
<tr><td><code>/item &lt;oggetto&gt; [n]</code></td><td>Dà un oggetto nello zaino (Sopravvivenza, es. <code>/item iron_ingot 5</code>)</td></tr>
<tr><td><code>/spawn &lt;specie&gt; [n]</code></td><td>Genera creature</td></tr>
<tr><td><code>/fly</code> · <code>/god</code> · <code>/heal</code> · <code>/mana</code> · <code>/peaceful</code></td><td>Volo · immortalità · salute al massimo · mana e stamina · mostri ostili on/off</td></tr>
<tr><td><code>/xp &lt;n&gt;</code></td><td>Aggiunge esperienza</td></tr>
<tr><td><code>/cast &lt;incantesimo&gt;</code> · <code>/scroll [nome]</code></td><td>Lancia un incantesimo senza requisiti · ti dà le pergamene segrete</td></tr>
<tr><td><code>/weapon &lt;arma&gt;|nessuna</code></td><td>Impugna un'arma senza requisiti</td></tr>
<tr><td><code>/equip &lt;slot&gt; &lt;oggetto&gt;</code> · <code>/set &lt;nome&gt;</code> · <code>/strip</code></td><td>Equipaggia un pezzo · un set intero (viandante, ferro, mithril, drago, contadino, lino, seta, arcano, runico) · toglie tutto</td></tr>
<tr><td><code>/locate [cripta|roccaforte|castello|rovine|cielo|cittadella|dojo]</code></td><td>Trova la struttura più vicina e ti dice dove andare (<code>/tp</code>); senza nome trova la prima che capita</td></tr>
<tr><td><code>/locate villaggio</code> · <code>/locate citta</code></td><td>Trova il villaggio o la città murata più vicini</td></tr>
<tr><td><code>/moneta [n]</code> · <code>/rep [n]</code></td><td>Aggiunge monete · cambia la reputazione con il villaggio vicino</td></tr>
<tr><td><code>/eredita [n|rinnova]</code> · <code>/frammenti [n]</code></td><td>Mostra o imposta il grado di Eredità, o risveglia il regno · aggiunge Frammenti d'Eredità</td></tr>
<tr><td><code>/comfort</code> · <code>/tema scuro|classico</code></td><td>Modalità comfort on/off · tema delle texture</td></tr>
<tr><td><code>/boss osso|magma|gelo|palude|re</code></td><td>Genera un guardiano</td></tr>
<tr><td><code>/trophies</code> · <code>/sigilli [n]</code> · <code>/finale</code></td><td>Sblocca i trofei · spezza i sigilli (3 svegliano il Re Eterno) · ti porta davanti alla Cittadella</td></tr>
<tr><td><code>/clima</code> (<code>/temperatura</code>)</td><td>Mostra la temperatura del corpo e cosa la cambia (Sopravvivenza)</td></tr>
<tr><td><code>/fame [n]</code> · <code>/reliquia [nome|tutte]</code> · <code>/bottino</code> · <code>/effetto</code> · <code>/maturo</code></td><td>Prove su fame, reliquie, bottino, effetti delle pozioni e colture (Sopravvivenza)</td></tr>
<tr><td><code>/libro</code></td><td>Scrive e apre il Libro dell'Avventura</td></tr>
<tr><td><code>/open [relay]</code> · <code>/close</code> · <code>/players</code></td><td>Apre la partita agli amici · la chiude · mostra chi c'è</td></tr>
<tr><td><code>/guida [reset|on|off]</code></td><td>La guida e i suggerimenti per i nuovi giocatori</td></tr>
</tbody></table></div>
`},

'faq': { title: 'Domande frequenti', html: `
<details class="faq"><summary>Dove si salvano i mondi?</summary><div>Nella cartella <code>saves</code> accanto al file del gioco. Per fare una copia, copia quella cartella. Il gioco salva da solo e anche dal menu di pausa.</div></details>
<details class="faq"><summary>Il gioco non parte</summary><div>Con l'installer (macOS, Windows, Linux) non serve Java: il gioco se lo porta dietro. Su Mac la prima volta usa clic destro → Apri; su Windows «Esegui comunque». Se usi il pacchetto con il <code>.jar</code> serve Java 17 o più recente (<a href="https://adoptium.net" target="_blank" rel="noopener">adoptium.net</a>). In ogni caso controlla che il driver grafico supporti OpenGL 3.</div></details>
<details class="faq"><summary>Le texture mi sembrano troppo scure</summary><div>Sono scure apposta, per stancare meno gli occhi. In <i>Opzioni</i> togli la casella «Texture scure» oppure scrivi <code>/tema classico</code> nella console: si ridipingono subito. Vedi <a href="#/comfort">Comfort e nitidezza</a>.</div></details>
<details class="faq"><summary>Dove finiscono gli screenshot?</summary><div><code>F12</code> li salva nella cartella <code>screenshots</code> accanto al gioco. <code>F2</code> nasconde l'interfaccia per una foto pulita.</div></details>
<details class="faq"><summary>Il gioco va a scatti</summary><div>In <i>Opzioni</i> abbassa la «Scala di rendering» (50–100%) o la distanza di visuale: il mondo si disegna a meno pixel ma resta fluido.</div></details>
<details class="faq"><summary>Come passo alla terza persona?</summary><div>Premi <code>T</code> (con gli amici, dove T è la chat, usa <code>F5</code>). <code>F6</code> cambia la spalla della camera.</div></details>
<details class="faq"><summary>Perché non posso più volare?</summary><div>Il volo (doppio Spazio) è solo in Creativo. In Sopravvivenza hai la planata e le cavalcature volanti, come il Grifone Celeste.</div></details>
<details class="faq"><summary>Perché non riesco a fabbricare la Forgia o le armi di mithril?</summary><div>Servono gli <a href="#/schemi">schemi</a>. Aprili nei forzieri delle cripte e roccaforti o sconfiggi i guardiani: le ricette bloccate dicono dove cercare.</div></details>
<details class="faq"><summary>Ho perso tutto morendo</summary><div>No: lo zaino è nella tomba, segnata da una colonna di luce. Sopra la barra del corpo vedi distanza e direzione. Se ne conservano cinque.</div></details>
<details class="faq"><summary>Come trovo un dominio?</summary><div>Ogni guardiano custodisce una pergamena: vedi <a href="#/domini">I sei Domini</a> e la tabella dei <a href="#/boss">boss</a>. Servono anche livello e Intelletto.</div></details>
<details class="faq"><summary>Gli effetti troppo forti mi danno fastidio</summary><div>In <i>Impostazioni</i> attiva «Riduci effetti (scosse e lampi)»: calma le scosse della camera e i lampi delle magie più grandi.</div></details>
<details class="faq"><summary>Dove segnalo un problema?</summary><div>Scrivi a <a href="mailto:dimastepa07@gmail.com">dimastepa07@gmail.com</a> o su Instagram <a href="https://instagram.com/_dm1tr7_laur" target="_blank" rel="noopener">@_dm1tr7_laur</a>.</div></details>
`},

'domini': { title: 'I sei Domini', html: `
<p class="intro">La scuola segreta dei Domini: mosse definitive, ognuna una cupola di un mondo tutto suo. Sono le uniche magie che nessun livello apre da solo: ogni guardiano custodisce una pergamena; poi servono livello e Intelletto.</p>
<h2>Il rito</h2>
<ol class="timeline"><li><b>L'eroe si alza in volo</b>Entra in posa (mani incrociate per il Vuoto, braccia spalancate per il Santuario, mani al cielo per gli altri) e per 3 secondi — 4,4 per i due più grandi — resta sospeso. Nulla può toccarlo; i nemici, quasi fermi, aspettano.</li>
<li><b>Pronuncia</b>«Espansione del Dominio…» e il nome del mondo. La camera gli gira intorno e le barre del cinema incorniciano lo schermo.</li>
<li><b>La cupola si apre</b>Un lampo e il terreno cambia per la durata del dominio; alla fine torna com'era.</li></ol>
<h2>Cosa fa dentro</h2>
<ul><li>I nemici normali sono <b>annientati</b> nei primi istanti.</li><li>I guardiani perdono più o meno la <b>metà</b> della vita (tra il 50 e il 65%) nell'arco del dominio, mai tutta: dopo devi finirli tu.</li><li>Dentro il proprio Dominio l'eroe recupera più in fretta: il mana fino a <b>×3</b> (Vuoto Infinito), <b>×2</b> (Foresta e gli altri), <b>×1,6</b> (Santuario); la stamina fino a <b>×3</b> nella Foresta, ×2,2 nell'Orologio, ×1,5 negli altri. Nell'Orologio anche i tempi di recupero degli incantesimi corrono 2,5 volte più veloci.</li></ul>
<h2>Vuoto Infinito</h2>
<ol class="timeline"><li><b>La quiete</b>Per circa 1,7 secondi tutto si ferma: creature, particelle, mondo. Nessun danno.</li><li><b>La rivelazione</b>Fino a ~3,7 s: il vuoto si apre, con la galassia e le stelle.</li><li><b>Le luci</b>Fino a ~7,6 s: raggi accecanti, lampi, pioggia di luce. Qui i nemici vengono colpiti e il guardiano subisce la maggior parte del danno.</li><li><b>Il crollo</b>La cupola implode con un ultimo colpo.</li></ol>
<h2>Santuario Malevolo</h2>
<p>Dal terreno sorgono un cortile di pietra scura e un santuario con quattro pilastri rossi, un tetto a tre livelli e denti d'osso. Dentro, una <b>tempesta di tagli</b>: decine ogni istante, corti e lunghi, anche a ventaglio, con un colpo enorme ogni tanto su un nemico solo. Alla fine il santuario torna sotto terra.</p>
<h2>Gli altri quattro</h2>
<p><b>Foresta Primordiale:</b> radici che trattengono i nemici, la linfa cura te. <b>Palazzo di Cristallo:</b> chi vi entra si congela, e quando si frantuma si frantuma anche lui. <b>Orologio del Tempo Fermo:</b> tutti immobili tranne te, che ti muovi e ti ricarichi più in fretta. <b>Cielo del Sovrano:</b> fulmini senza fine.</p>
<h2>I numeri</h2>
<div data-table="domains"></div>
<div class="callout tip"><b>Dietro al menu</b> del gioco c'è proprio uno spettacolo di Domini al rallentatore contro un boss, con il tuo eroe.</div>
`},

'arti': { title: 'Arti marziali e dojo', html: `
<p class="intro">Sette arti — una per famiglia di armi più il pugno — con un rango da 1 a 10.</p>
<ul><li>Ogni colpo che va a segno allena l'arte in mano. Sui manichini dei dojo (che non si rompono) dà tre volte la maestria.</li>
<li>Ogni rango dà più danno e più tempo per parare; al 4° e al 7° la catena di colpi guadagna una mossa; al 6° il colpo finale spacca il terreno; al 10° sei un Maestro.</li>
<li>Quando la barra dell'arte è piena (scheda <b>Arti</b>) parla con il <b>maestro</b> del dojo (tasto destro) e sfidalo con quell'arte: batti il maestro (portalo al 25% di vita) per salire di rango.</li>
<li>Le sei classi marziali (Monaco, Samurai, Ninja, Lanciere, Berserker, Titano) partono con la loro arte già al 3° rango; ogni classe impara la propria arte una volta e mezza più in fretta.</li></ul>
<div data-table="arts"></div>
`},

'schemi': { title: 'Schemi e Forgia', html: `
<p class="intro">In Sopravvivenza le armi e armature migliori vogliono uno <b>schema</b>: finché non lo trovi, la ricetta resta bloccata e scura nell'Artigiano (ti dice dove cercarlo). Sono quattro.</p>
<div class="callout"><b>Dove si trovano.</b> Nei forzieri di cripte, roccaforti e castelli, e come bottino dei guardiani (tutti tranne il Re Eterno): la tabella qui sotto dice quale schema sta dove. La <b>Forgia runica</b> è il banco di lavoro per mithril e scaglie di drago.</div>
`},

'diario': { title: 'Diario di Eldrin', html: `
<p class="intro">Sedici pagine del diario dello scriba del re, sparse nel mondo. <b>Attenzione: raccontano la storia del gioco e contengono spoiler.</b> Raccogliendone quindici si apre il <b>Sigillo</b>: +15% di danno al Re Eterno e −15% di quello che ti fa.</p>
`},

'biomi': { title: 'Biomi', html: `
<p class="intro">Tredici biomi nel mondo grande. La temperatura qui sotto è quella dell'aria: serve in Sopravvivenza (vedi <a href="#/clima">Freddo e caldo</a>); i biomi influenzano anche il tipo di creature, di alberi e le affinità di magia.</p>
`},

'creature': { title: 'Creature', html: `
<p class="intro">Animali, mostri e guardiani. I mostri compaiono soprattutto di notte e nelle caverne. Le creature con la voce «Cavalcatura» si possono domare: vedi <a href="#/cavalcature">Cavalcature</a>.</p>
`},

'villaggi': { title: 'Villaggi e missioni', html: `
<p class="intro">Il mondo ha delle persone. Nelle pianure, nelle savane, nelle taighe e nei deserti sorgono <b>villaggi</b> (raggio 45) e <b>città murate</b> (raggio 57): piazza con il pozzo, mercato a tendoni colorati, case di sei tipi, locanda, cappella, mulino, campi, lampioni lungo le strade. Ci vivono quindici tipi di persone, ognuna con la sua faccia e una giornata vera: lavorano, la sera si ritrovano in piazza, di notte dormono a casa.</p>
<h2>Come li trovi</h2>
<p><code>/locate villaggio</code> e <code>/locate citta</code> dicono dov'è il più vicino. La prima volta che ne scopri uno compare un cartello con il suo nome (e un'impresa).</p>
<h2>Gli abitanti</h2>
<p>Restano vicino a casa, sono invulnerabili e ti guardano quando passi. Tasto destro su uno di loro, entro 5,5 blocchi, e comincia il dialogo: barre da film, due inquadrature, le risposte si scelgono con i numeri.</p>
<div data-table="npcs"></div>
<h2>Il mercato</h2>
<p>La valuta sono le <b>monete</b>, un oggetto vero che porti nello zaino. La finestra del mercato ha due colonne: la merce in vendita e il tuo zaino. Clic = uno; clic destro = cinque se compri, tutta la pila se vendi.</p>
<ul>
<li>Si <b>compra a un terzo sopra il valore</b> dell'oggetto e si <b>vende al suo valore</b>. Ciò che vale una moneta si vende a zero: non esiste un giro di acquisti e rivendite che faccia guadagnare.</li>
<li>La <b>reputazione</b> è per villaggio e dà gli sconti: Straniero (0 punti) nessuno, Conosciuto (10) 5%, Amico (30) 10%, Eroe del villaggio (60) 20%.</li>
<li>Ogni mestiere ha le sue specialità: il Fabbro compra metalli e armi, il Cacciatore pellicce e trofei, l'Erborista erbe e pozioni, il Contadino raccolti, l'Oste cibo.</li>
<li>Un'arma usurata vale meno; una temprata vale il 20% in più per ogni livello.</li>
</ul>
<h2>Le missioni</h2>
<p>Ogni abitante che dà incarichi ne propone alcuni, adatti al tuo livello. Cinque tipi:</p>
<ul>
<li><b>Caccia</b>: uccidi un certo numero di creature di una specie.</li>
<li><b>Consegna</b>: porta oggetti; si contano dallo zaino al momento di consegnare.</li>
<li><b>Creazione</b>: fabbrica un oggetto o un'arma precisi.</li>
<li><b>Esplorazione</b>: raggiungi una struttura (cripta, roccaforte, rovine…).</li>
<li><b>Guardiano</b>: sconfiggi uno dei boss (dal primo grado di <a href="#/eredita">Eredità</a> anche su taglia).</li>
</ul>
<p>Si pagano in <b>monete, punti esperienza, reputazione</b> e a volte un oggetto. Puoi tenere <b>otto missioni</b> alla volta: le segui nel Libro dell'Eroe (scheda <i>Missioni</i>) e in un riquadro a schermo che dice cosa fare e da chi tornare. I progressi si contano da soli.</p>
<div class="callout tip"><b>Consiglio.</b> Prima di una lunga spedizione passa dal Cacciatore e dall'Anziano: le missioni di caccia e di esplorazione spesso coincidono con quello che farai comunque.</div>
`},

'abitanti': { title: 'Abitanti dei villaggi', html: `
<p class="intro">I quindici tipi di abitanti dei villaggi e dei dojo. Per saperne di più su come si parla, si commercia e si accettano missioni, leggi <a href="#/villaggi">Villaggi e missioni</a>.</p>
`},

'minerali': { title: 'Minerali', html: `
<p class="intro">Nove minerali nuovi: quattro comuni che diventano le armi di tutti i giorni e cinque <b>cristalli rarissimi</b> che danno poteri alle armi. Le armi migliori nascono qui sotto.</p>
<ul>
<li><b>Rame e stagno</b> si fondono nel forno; <b>3 lingotti di rame + 1 di stagno</b> danno 4 lingotti di <b>bronzo</b>. <b>1 lingotto di ferro + 2 carbone</b> danno un lingotto d'<b>acciaio</b>: entrambe le leghe si fanno nella fornace.</li>
<li><b>Argento</b>: armi che fanno il 60% di danno in più ai non morti (argento sacro). <b>Cobalto</b>: il metallo più duro tra i comuni.</li>
<li><b>Cristalli rari</b> (fiammite, brinite, voltite, sanguinite, ombrite): compaiono solo in <b>regioni</b> grandi come un terzo del mondo, a profondità precise; si lavorano alla <a href="#/schemi">Forgia runica</a> e danno un effetto a ogni colpo: fiamme, gelo, tuono a catena, vampirismo, ombra.</li>
<li>Dieci anelli e amuleti rari portano gli stessi poteri senza impugnare l'arma.</li>
</ul>
<div class="callout tip"><b>Come cercarli.</b> Scava in profondità vicino a grandi caverne; il piccone deve essere del grado giusto (vedi colonna «Grado minimo» nella tabella dei <a href="#/blocchi">blocchi</a>). Se in una zona non trovi cristalli, cambia regione: sono rari proprio perché sono a macchia.</div>
`},

'eredita': { title: 'Eredità', html: `
<p class="intro">Dopo aver battuto il Re Eterno, l'Anziano di un villaggio può <b>risvegliare il regno</b>: guardiani, sigilli e guarnigioni tornano, più forti. Il mondo ti paga meglio per questo. Il grado di Eredità va da 1 a 10.</p>
<ul>
<li><b>Più dura</b>: ogni grado dà +35% di vita e +18% di danno a guardiani e guarnigioni, +10% e +6% ai mostri selvaggi.</li>
<li><b>Più generosa</b>: +25% di esperienza per ogni grado. I guardiani lasciano <b>Frammenti d'Eredità</b> (il Re Eterno più di tutti); dal secondo grado anche i capitani delle guarnigioni, ogni tanto. I frammenti non si vendono.</li>
<li><b>Tempra</b>: il Fabbro porta un'arma fino a +5 in cambio di frammenti e monete. Ogni livello dà <b>+10% di danno</b> e un'usura più lenta. Il livello massimo che accetta è 1 + il grado di Eredità.</li>
<li><b>Taglie</b>: dal primo grado Guardia e Cacciatore mettono taglie sui guardiani, pagate in frammenti.</li>
</ul>
<h2>La tempra, livello per livello</h2>
<div data-table="temper"></div>
<h2>I dieci gradi</h2>
`},

'comfort': { title: 'Comfort e nitidezza', html: `
<p class="intro">Il gioco è fatto per essere giocato a lungo. Queste impostazioni (<i>Opzioni</i> del menu) servono a stancare meno gli occhi.</p>
<h2>Texture scure</h2>
<p>Di default le texture sono scure e morbide: saturazione ridotta, verdi verso l'oliva, ombre fredde e luci ambrate; la neve non è più bianco puro e le superfici larghe non hanno più macchie che si ripetono. Le facce dei blocchi naturali ruotano a caso, così il disegno non si vede come una scacchiera. Per tornare a quelle classiche togli la casella «Texture scure» o scrivi <code>/tema classico</code>: si ridipingono subito.</p>
<h2>Modalità comfort</h2>
<p>Camera ferma (niente ondeggiamento, inclinazioni né zoom di corsa), luci più morbide negli incantesimi grandi e nei domini, e un promemoria ogni 45 minuti per distogliere lo sguardo dallo schermo. <code>/comfort</code> la accende e la spegne.</p>
<h2>Filtro caldo</h2>
<p>Toglie il blu dalla luce, da 0 a 100%. Con «solo la sera» si attiva dalle 19 alle 7 sull'orologio del computer.</p>
<h2>Riduci effetti</h2>
<p>Attenua le scosse della camera e i lampi delle magie grandi. La modalità comfort lo comprende.</p>
<h2>Nitidezza e fluidità</h2>
<p>Il mondo è disegnato a <b>tutti i pixel dello schermo</b>, anche sugli schermi ad alta densità. Se il computer fatica, la <b>Scala di rendering</b> (50–100%) disegna meno pixel e ingrandisce: più fluidità, un po' meno nitidezza. Anche la distanza di visuale pesa molto.</p>
<h2>Modalità foto</h2>
<p><code>F2</code> nasconde l'interfaccia (restano gli effetti delle magie), <code>F12</code> salva uno screenshot PNG nella cartella <code>screenshots</code> accanto al gioco. In terza persona (<code>T</code>) puoi fotografare anche l'eroe.</p>
`},
};
