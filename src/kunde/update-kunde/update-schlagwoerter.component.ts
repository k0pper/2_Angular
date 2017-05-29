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

import {Component, Input, OnInit} from '@angular/core'
import {FormBuilder, FormControl, FormGroup} from '@angular/forms'
import {Router} from '@angular/router'

import {HOME_PATH} from '../../app/root.routing'
import {isBlank, log} from '../../shared'
import {Kunde} from '../shared'
import {KundeService} from '../shared/kunde.service'

/**
 * Komponente f&uuml;r das Tag <code>hs-schlagwoerter</code>
 */
@Component({
    selector: 'hs-update-schlagwoerter',
    templateUrl: './update-schlagwoerter.component.html',
})
export default class UpdateSchlagwoerterComponent implements OnInit {
    // <hs-schlagwoerter [kunde]="...">
    @Input() kunde: Kunde

    form: FormGroup
    javascript: FormControl
    typescript: FormControl

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly kundeService: KundeService,
        private readonly router: Router) {
        console.log('UpdateSchlagwoerterComponent.constructor()')
    }

    /**
     * Das Formular als Gruppe von Controls initialisieren und mit den
     * Schlagwoertern des zu &auml;ndernden Kundes vorbelegen.
     */
    @log
    ngOnInit() {
        console.log('kunde=', this.kunde)

        // Definition und Vorbelegung der Eingabedaten (hier: Checkbox)
        const hasJavaScript = this.kunde.hasSchlagwort('JAVASCRIPT')
        this.javascript = new FormControl(hasJavaScript)
        const hasTypeScript = this.kunde.hasSchlagwort('TYPESCRIPT')
        this.typescript = new FormControl(hasTypeScript)

        this.form = this.formBuilder.group({
            // siehe ngFormControl innerhalb von @Component({template: `...`})
            javascript: this.javascript,
            typescript: this.typescript,
        })
    }

    /**
     * Die aktuellen Schlagwoerter f&uuml;r das angezeigte Kunde-Objekt
     * zur&uuml;ckschreiben.
     * @return false, um das durch den Button-Klick ausgel&ouml;ste Ereignis
     *         zu konsumieren.
     */
    @log
    onUpdate() {
        if (this.form.pristine) {
            console.log('keine Aenderungen')
            return
        }

        if (isBlank(this.kunde)) {
            console.error('kunde === undefined/null')
            return
        }

        this.kunde.updateSchlagwoerter(
            this.javascript.value, this.typescript.value)
        console.log('kunde=', this.kunde)

        const successFn = () => {
            console.log(
                `UpdateSchlagwoerterComponent: successFn: path: ${HOME_PATH}`)
            this.router.navigate([HOME_PATH])
        }
        const errorFn: (status: number, text: string) => void | undefined =
            undefined as any
        this.kundeService.update(this.kunde, successFn, errorFn)

        // damit das (Submit-) Ereignis konsumiert wird und nicht an
        // uebergeordnete Eltern-Komponenten propagiert wird bis zum
        // Refresh der gesamten Seite
        return false
    }

    toString() {
        return 'UpdateSchlagwoerterComponent'
    }
}
