// tslint:disable:max-file-line-count

/*
 * Copyright (C) 2015 - 2017 Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as _ from 'lodash'
import * as moment from 'moment'
import 'moment/locale/de'

import {isBlank, isEmpty, isPresent} from '../../shared'

moment.locale('de')

const MIN_RATING = 0
const MAX_RATING = 5

export declare type Verlag = 'IWI_VERLAG' | 'HSKA_VERLAG'
export declare type KundeArt = 'KINDLE' | 'DRUCKAUSGABE'

/**
 * Gemeinsame Datenfelder unabh&auml;ngig, ob die Kundedaten von einem Server
 * (z.B. RESTful Web Service) oder von einem Formular kommen.
 */
export interface KundeShared {
    _id?: string|undefined
    titel?: string|undefined
    verlag?: Verlag|undefined
    art: KundeArt|undefined
    preis: number|undefined
    rabatt: number|undefined
    datum: string|undefined
    lieferbar: boolean|undefined
    email: string|undefined
}

/**
 * Daten vom und zum REST-Server:
 * <ul>
 *  <li> Arrays f&uuml;r mehrere Werte, die in einem Formular als Checkbox
 *       dargestellt werden.
 *  <li> Daten mit Zahlen als Datentyp, die in einem Formular nur als
 *       String handhabbar sind.
 * </ul>
 */
export interface KundeServer extends KundeShared {
    rating: number|undefined
    schlagwoerter?: Array<string>|undefined
}

/**
 * Daten aus einem Formular:
 * <ul>
 *  <li> je 1 Control fuer jede Checkbox und
 *  <li> au&szlig;erdem Strings f&uuml;r Eingabefelder f&uuml;r Zahlen.
 * </ul>
 */
export interface KundeForm extends KundeShared {
    rating: string
    javascript?: boolean
    typescript?: boolean
}

/**
 * Model als Plain-Old-JavaScript-Object (POJO) fuer die Daten *UND*
 * Functions fuer Abfragen und Aenderungen.
 */
export class Kunde {
    public ratingArray: Array<boolean> = []

    /**
     * Ein Kunde-Objekt mit JSON-Daten erzeugen, die von einem RESTful Web
     * Service kommen.
     * @param kunde JSON-Objekt mit Daten vom RESTful Web Server
     * @return Das initialisierte Kunde-Objekt
     */
    static fromServer(kundeServer: KundeServer) {
        let datum: moment.Moment|undefined
        if (isPresent(kundeServer.datum)) {
            const tmp = kundeServer.datum as string
            datum = moment(tmp)
        }
        const kunde = new Kunde(
            kundeServer._id, kundeServer.titel, kundeServer.rating, kundeServer.art,
            kundeServer.verlag, datum, kundeServer.preis, kundeServer.rabatt,
            kundeServer.lieferbar, kundeServer.schlagwoerter, kundeServer.email)
        console.log('Kunde.fromServer(): kunde=', kunde)
        return kunde
    }

    /**
     * Ein Kunde-Objekt mit JSON-Daten erzeugen, die von einem Formular kommen.
     * @param kunde JSON-Objekt mit Daten vom Formular
     * @return Das initialisierte Kunde-Objekt
     */
    static fromForm(kundeForm: KundeForm) {
        const schlagwoerter: Array<string> = []
        if (kundeForm.javascript) {
            schlagwoerter.push('JAVASCRIPT')
        }
        if (kundeForm.typescript) {
            schlagwoerter.push('TYPESCRIPT')
        }

        const datumMoment = isEmpty(kundeForm.datum) ?
            undefined :
            moment(kundeForm.datum as string)

        const rabatt = kundeForm.rabatt === undefined ? 0 : kundeForm.rabatt / 100
        const kunde = new Kunde(
            kundeForm._id, kundeForm.titel, +kundeForm.rating, kundeForm.art,
            kundeForm.verlag, datumMoment, kundeForm.preis, rabatt,
            kundeForm.lieferbar, schlagwoerter, kundeForm.email)
        console.log('Kunde.fromForm(): kunde=', kunde)
        return kunde
    }

    // http://momentjs.com
    get datumFormatted() {
        let result: string|undefined
        if (isPresent(this.datum)) {
            const datum = this.datum as moment.Moment
            result = datum.format('Do MMM YYYY')
        }
        return result
    }

    get datumFromNow() {
        let result: string|undefined
        if (isPresent(this.datum)) {
            const datum = this.datum as moment.Moment
            result = datum.fromNow()
        }
        return result
    }

    /**
     * Abfrage, ob im Kundetitel der angegebene Teilstring enthalten ist. Dabei
     * wird nicht auf Gross-/Kleinschreibung geachtet.
     * @param titel Zu &uuml;berpr&uuml;fender Teilstring
     * @return true, falls der Teilstring im Kundetitel enthalten ist. Sonst
     *         false.
     */
    containsTitel(titel: string) {
        let result = true
        if (isPresent(this.titel)) {
            const tmp = this.titel as string
            result = tmp.toLowerCase().includes(titel.toLowerCase())
        }
        return result
    }

    /**
     * Die Bewertung ("rating") des Kundees um 1 erh&ouml;hen
     */
    rateUp() {
        if (this.rating !== undefined && this.rating < MAX_RATING) {
            this.rating++
        }
    }

    /**
     * Die Bewertung ("rating") des Kundees um 1 erniedrigen
     */
    rateDown() {
        if (this.rating !== undefined && this.rating > MIN_RATING) {
            this.rating--
        }
    }

    /**
     * Abfrage, ob das Kunde dem angegebenen Verlag zugeordnet ist.
     * @param verlag der Name des Verlags
     * @return true, falls das Kunde dem Verlag zugeordnet ist. Sonst false.
     */
    hasVerlag(verlag: string) {
        return this.verlag === verlag
    }

    /**
     * Aktualisierung der Stammdaten des Kunde-Objekts.
     * @param titel Der neue Kundetitel
     * @param rating Die neue Bewertung
     * @param art Die neue Kundeart (DRUCKAUSGABE oder KINDLE)
     * @param verlag Der neue Verlag
     * @param preis Der neue Preis
     * @param rabatt Der neue Rabatt
     */
    updateStammdaten(
        titel: string, art: KundeArt, verlag: Verlag, rating: number,
        datum: moment.Moment|undefined, preis: number|undefined,
        rabatt: number|undefined) {
        this.titel = titel
        this.art = art
        this.verlag = verlag
        this.rating = rating
        this.ratingArray = []
        _.times(rating - MIN_RATING, () => this.ratingArray.push(true))
        this.datum = datum
        this.preis = preis
        this.rabatt = rabatt
    }

    /**
     * Abfrage, ob es zum Kunde auch Schlagw&ouml;rter gibt.
     * @return true, falls es mindestens ein Schlagwort gibt. Sonst false.
     */
    hasSchlagwoerter() {
        if (isBlank(this.schlagwoerter)) {
            return false
        }
        const tmpSchlagwoerter = this.schlagwoerter as Array<string>
        return tmpSchlagwoerter.length !== 0
    }

    /**
     * Abfrage, ob es zum Kunde das angegebene Schlagwort gibt.
     * @param schlagwort das zu &uuml;berpr&uuml;fende Schlagwort
     * @return true, falls es das Schlagwort gibt. Sonst false.
     */
    hasSchlagwort(schlagwort: string) {
        if (isBlank(this.schlagwoerter)) {
            return false
        }
        const tmpSchlagwoerter = this.schlagwoerter as Array<string>
        return tmpSchlagwoerter.includes(schlagwort)
    }

    /**
     * Aktualisierung der Schlagw&ouml;rter des Kunde-Objekts.
     * @param javascript ist das Schlagwort JAVASCRIPT gesetzt
     * @param typescript ist das Schlagwort TYPESCRIPT gesetzt
     */
    updateSchlagwoerter(javascript: boolean, typescript: boolean) {
        this.resetSchlagwoerter()
        if (javascript) {
            this.addSchlagwort('JAVASCRIPT')
        }
        if (typescript) {
            this.addSchlagwort('TYPESCRIPT')
        }
    }

    /**
     * Konvertierung des Kundeobjektes in ein JSON-Objekt f&uuml;r den RESTful
     * Web Service.
     * @return Das JSON-Objekt f&uuml;r den RESTful Web Service
     */
    toJSON(): KundeServer {
        const datum = this.datum === undefined ?
            undefined :
            this.datum.format('YYYY-MM-DD')
        return {
            _id: this._id,
            titel: this.titel,
            rating: this.rating,
            art: this.art,
            verlag: this.verlag,
            datum,
            preis: this.preis,
            rabatt: this.rabatt,
            lieferbar: this.lieferbar,
            schlagwoerter: this.schlagwoerter,
            email: this.email,
        }
    }

    toString() {
        return JSON.stringify(this, null, 2)
    }

    // wird aufgerufen von fromServer() oder von fromForm()
    private constructor(
        // tslint:disable-next-line:variable-name
        public _id: string|undefined, public titel: string|undefined,
        public rating: number|undefined, public art: KundeArt|undefined,
        public verlag: Verlag|undefined, public datum: moment.Moment|undefined,
        public preis: number|undefined, public rabatt: number|undefined,
        public lieferbar: boolean|undefined,
        public schlagwoerter: Array<string>|undefined,
        public email: string|undefined) {
        this._id = _id || undefined
        this.titel = titel || undefined
        this.rating = rating || undefined
        this.art = art || undefined
        this.verlag = verlag || undefined
        this.datum =
            isPresent(datum) ? datum : moment(new Date().toISOString())
        this.preis = preis || undefined
        this.rabatt = rabatt || undefined
        this.lieferbar = lieferbar || undefined

        if (isBlank(schlagwoerter)) {
            this.schlagwoerter = []
        } else {
            const tmpSchlagwoerter = schlagwoerter as Array<string>
            this.schlagwoerter = tmpSchlagwoerter
        }
        if (rating !== undefined) {
            _.times(rating - MIN_RATING, () => this.ratingArray.push(true))
            _.times(MAX_RATING - rating, () => this.ratingArray.push(false))
        }
        this.email = email || undefined
    }

    private resetSchlagwoerter() {
        this.schlagwoerter = []
    }

    private addSchlagwort(schlagwort: string) {
        if (isBlank(this.schlagwoerter)) {
            this.schlagwoerter = []
        }
        const tmpSchlagwoerter = this.schlagwoerter as Array<string>
        tmpSchlagwoerter.push(schlagwort)
    }
}
