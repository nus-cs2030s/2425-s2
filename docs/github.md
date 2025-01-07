# Linking Your PE Account to Your GitHub Account

## Prerequisites

1. You should already have your SoC Unix account, cluster access, and SoC VPN set up, and be able to `ssh` into one of the PE hosts.  If you are not able to do this, please look at the guide on [programming environments](environments.md).
2. You should feel comfortable running basic UNIX commands.  If you have not gone through the UNIX guide and got your hands dirty, please [look at the guide and play with the various basic Unix commands](unix/essentials.md).
3. You should already have a GitHub account and can log into [GitHub.com](https://www.github.com).
4. {++You know how to create and edit a file in Vim++}

## Purpose

You will be using `git` (indirectly) for retrieving skeleton code and submitting completed assignments.  We will set up your accounts on a PE host below so that `git` will be associated with your GitHub account.  This is a one-time setup.  You don't have to do this for every assignment.

## 1. Setting up `.gitconfig`

Create and edit a file called `.gitconfig` in **your home directory on the PE host**, with the following content:

```text
[user]
  name = Your Name
  email = Your Email
[github]  
  user = Your GitHub Username
```

Your email should be whatever you used to sign up on GitHub (which may not be your SoC or NUS email).

For example, a sample `.gitconfig` looks like this:

```text
[user]
  name = Elsa
  email = queen@arendelle.gov
[github]  
  user = elsasnow16
```

After saving this file, run:

```
git config --get github.user
```

It should return your GitHub username.

It should print your GitHub username as already set.  If there is a typo, you need to edit `.gitconfig` again and reload it by repeating the command above.

## 2. Setting up Password-less Login

### Basic of SSH Keys

SSH uses _public-key cryptography_ for authentication.  The keys come in pairs: a public key and a private key.  The private key must be kept safe and known only to you.  You should keep the private key in your PE account, and not share it with others.

To authenticate yourself to another host or service, you configure the host/service with your public key.  When it is time for you to log in, your private key is "matched"[^1] with your public key.  Since only you know your private key, the service or the host can be sure that you are you and not someone else.

Suppose you want to log in from host _X_ to host _Y_ without a password.  You generate a pair of keys on _X_, then keep the private keys on _X_ and store the public keys on _Y_.  If you want to [set up SSH Keys](environments.md#setting-up-ssh-keys) so that you can log into a PE host from your computer without a password, for example, you generate the pair of keys on your computer (_e.g., X_) and then copy the public key to a PE host.

Our goal now is to authenticate ourselves to GitHub from the PE host.  So, _X_ is the PE host, and _Y_ is GitHub.

### Generating SSH keys

The steps are explained in detail on [GitHub Docs](https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent).  Here is a summary of the steps that you should follow:

On any of the PE hosts, run
```
ssh-keygen -t ed25519 -C "your_email@example.com"
```
where `your_email@example.com` is the email you used when you signed up for your GitHub account (i.e., the same one you entered in `.gitconfig`).

The command will prompt you where to save the key.  Just press ++enter++ to save into the default location, which is `$HOME/.ssh/id_ed25519`.

You will then be prompted for a passphrase.  Since our goal is to automate assignment submission without needing to type anything, you should enter an empty passphrase.  This increases the security risk, but then, we are working with lab assignments, not a top-secret project.  So empty passphrase will do.

You should see something like this:
```
ooiwt@pe119:~$ ssh-keygen -t ed25519 -C "ooiwt@comp.nus.edu.sg"
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/o/ooiwt/.ssh/id_ed25519):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /home/o/ooiwt/.ssh/id_ed25519.
Your public key has been saved in /home/o/ooiwt/.ssh/id_ed25519.pub.
The key fingerprint is:
SHA256:Br3wg7mplVuPyuDz8yZVDSh8Mn5ls5+yPZhTvGzmAkk ooiwt@comp.nus.edu.sg
The key's randomart image is:
+--[ED25519 256]--+
|   .   .         |
|    = o.=        |
|   . =oo.=.      |
|   .E=.=o...     |
|  ..Bo=ooS. .    |
| . =o+.++ o      |
|  + +o = +       |
|   oo = O        |
|    .=oB..       |
+----[SHA256]-----+
```

### Adding Your PE Host Public Key to Your GitHub Account


The next step involves logging into GitHub.com: click on your avatar in the top right corner, and choose "Settings".  Then choose "SSH and GPG keys" on the sidebar.

Then, click either "New SSH key" or "Add SSH key".  Enter an appropriate title for the key (e.g., "PE Hosts").

Next, you need to paste your public key into the text box.  Go back to your terminal and run 

```
cat ~/.ssh/id_ed25519.pub
```

Remember that `cat` just dumps the content of the file to the standard output.  Now, you need to copy the content of the file displayed on the terminal, which is your public key, and paste it into the text box in the browser.  Your key should start with `ssh-ed22519` and end with your email address.  For instance, this is the exact text that I copy-pasted:
```
ssh-ed25519 AAAZC3NzaC1lZDI1NTE8AAAAIDdmwMpRrhRB95u7CTahehtBEeOdhSxDQdlpCxBK3KCP ooiwt@comp.nus.edu.sg
```

I showed the above as an example, don't use my public key for your GitHub.  Otherwise, I will have access to your account.

After entering the title and key above, click the green "Add SSH key" button to add the key you entered.  If prompted, confirm your GitHub password.

These steps are explained in detail on [GitHub Docs](https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account).

## 3. Checking Your Authentication Settings

To check if you can connect to `git@github.com` using SSH keys, run:
```
ssh -T git@github.com
```

If everything is set up correctly, you will see the message
```
Hi ooiwt! You've successfully authenticated, but GitHub does not provide shell access.
```

Otherwise, you should see
```
git@github.com: Permission denied (publickey).
```

or other error messages.

Note that you need to connect with the username `git`.  Do not use your GitHub username (e.g., do not use `ssh -T ooiwt@github.com`)

## 4. Accept and Retrieve a Test Skeleton from GitHub

We have created an empty lab for you to test if you can correctly retrieve future lab files from GitHub.  Complete the following steps:

- Click here [https://classroom.github.com/a/35k4fcsd](https://classroom.github.com/a/35k4fcsd).  You should see a page that looks like the following:

![accept](figures/accept-assignment-demo.png){: style="width:500px"}

- Click the accept button.  Wait a bit and then refresh until you see a "You're ready to go" message.

- Now, on your PE host, run

```Bash
~cs2030s/get setup-test
```

If everything works well, you should see:

```
Cloning into 'setup-test-<username>'...
remote: Enumerating objects: 3, done.
remote: Counting objects: 100% (3/3), done.
remote: Compressing objects: 100% (2/2), done.
remote: Total 3 (delta 0), reused 2 (delta 0), pack-reused 0
Receiving objects: 100% (3/3), done.
```

Change your working directory into `setup-test-<username>` and look at the directory content.  It should contain a file `README.md`. 

[^1]: I skipped many cool details here.  This topic is part of CS2105 and CS2107.  Interested students can search for various articles and videos online about how public-key cryptography is used for authentication.
